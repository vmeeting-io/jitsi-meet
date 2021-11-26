'use strict';

import * as tf from '@tensorflow/tfjs';
import { isEqual, map } from 'lodash';

import {
  calc_BB_area,
  check_large_pose_from_ref,
  get_thetas,
  is_eye_close,
  normalize_frame,
  predict_BB,
  pred_landmarks
} from './utils/utils';

async function getReferenceData(model, landmarkModel, frame) {
  const frameNormed = normalize_frame(frame, 240, 320);

  const output = await model.predict(frameNormed);
  // console.log('getReferenceData: output=', output);

  const boxes = output[0];
  const confidences = output[1];

  let faces = await predict_BB(frame.shape[1], frame.shape[0], confidences, boxes, 0.7);

  if (faces.shape[0] > 0) {
    faces = faces.unstack();
    const areas = faces.map(face => calc_BB_area(face));
    const maxIndex = areas.indexOf(Math.max(...areas));

    // console.log('getReferenceData:', areas, maxIndex);
    // faces[maxIndex].print();
    let box = faces[maxIndex]
      .round()
      .asType('int32')
      .clipByValue(0, Number.MAX_VALUE).arraySync();

    const [ landmark5, face_landmarks ] = await pred_landmarks(landmarkModel, frame, box);
    // console.log('pred_landmarks:', landmark5, face_landmarks);

    const thetas = get_thetas(landmark5, box.slice(0, 4));
    const [ _, r_EAR, l_EAR, eyes_area ] = is_eye_close(face_landmarks, 0.15);

    return [
      { r_EAR, l_EAR, eyes_area, landmark5, thetas },
      1,
      box
    ];
  } else {
    return [ null, 0, [0, 0, 0, 0] ];
  }
}

async function inferenceFrame(model, landmarkModel, frame, refData) {
  const frameNormed = normalize_frame(frame, 240, 320);

  const output = await model.predict(frameNormed);
  const boxes = output[0];
  const confidences = output[1];
  let faces = await predict_BB(frame.shape[1], frame.shape[0], confidences, boxes, 0.7);

  let eyeClose = false;
  let box = [0, 0, 0, 0];
  let status = 0;
  let landmarks = [];

  // 얼굴이 검출되면
  if (faces.shape[0] > 0) {
    faces = faces.unstack();
    const areas = faces.map(face => calc_BB_area(face));
    const max = Math.max(...areas);
    const maxIndex = areas.indexOf(max);

    // console.log('face max area:', max, maxIndex);
    if (max <= frame.shape[0] * frame.shape[1] * 0.01) {
      status = 2;
    } else {
      box = faces[maxIndex]
        .round()
        .asType('int32')
        .clipByValue(0, Number.MAX_VALUE).arraySync();

      landmarks = await pred_landmarks(landmarkModel, frame, box);
      const [ landmark5, face_landmarks ] = landmarks;

      // console.log('pred_landmarks:', landmark5, face_landmarks);

      const meanEyeArea = tf.mean(map(refData, 'eyes_area')).arraySync();
      // console.log('MEA:', meanEyeArea);

      eyeClose = false;
      if (meanEyeArea >= 200) {
        const maxL = Math.max(...map(refData, 'l_EAR'));
        const maxR = Math.max(...map(refData, 'r_EAR'));
        const threshold = (maxL + maxR) / 2.0 * 0.6;
        eyeClose = is_eye_close(face_landmarks, threshold)[0];
      }

      const avgThetas = tf.mean(map(refData, 'thetas'), 0).arraySync();
      const refRatioLR = (avgThetas[0] + avgThetas[6]) / (avgThetas[1] + avgThetas[7]);
      const refRatioUD = (avgThetas[2] + avgThetas[3]) / (avgThetas[4] + avgThetas[5]);

      const ret = check_large_pose_from_ref(landmark5, box.slice(0, 4), refRatioLR, refRatioUD);
      console.log('check_large_pose_from_ref:', ret);

      status = ret === 0 ? 0 : 1; // 집중(0), 비집중(1) 여부
    }
  } else {
    status = 2;
  }

  return [status, eyeClose, box, landmarks];
}

addEventListener('message', async event => {
  const { command, data } = event.data;
  // console.log('worker:', command, data);

  if (command === 'initialize') {
    self.nFrame = 1;
    self.prepared = false;
    self.refData = [];
    self.prevBox = [0, 0, 0, 0];
    self.isSleep = [];
    self.patience = event.data.patience || 20;
    self.ready = false;
    self.model = await tf.loadGraphModel('/libs/retinaface.json');
    // self.landmarkModel.prepare(0.4);
    self.landmarkModel = await tf.loadGraphModel('/libs/pfld.json');

    // for load at start time
    await getReferenceData(self.model, self.landmarkModel, tf.zeros([720, 1280, 3]));

    console.time('get references');
    postMessage({ done: true, data: 'initialized' });
    return;
  } else if (command === 'inference') {
    self.prepared = true;

    console.timeEnd('get references');
    postMessage({ done: true, data: 'started' });
    return;
  }

  const frame = tf.browser.fromPixels(data);
  if (!frame || !frame.shape[0] || !frame.shape[1]) {
      console.error('ERROR: runInference is failed');
      return;
  }
  // console.log('frame.shape:', frame.shape);

  if (!self.prepared) {
    try {
      console.time('getReferenceData');
      // console.log('frame.shape', frame.shape);
      const [data, ret, box] = await getReferenceData(self.model, self.landmarkModel, frame);
      console.timeEnd('getReferenceData');
      // console.log('getReferenceData:', data, ret, box);
  
      if (ret && !isEqual(box, self.prevBox)) {
        self.refData.push(data);
        self.nFrame += 1;

        if (self.nFrame > self.patience) {
          self.refData.shift();
          self.ready = true;
        }
      }
      self.prevBox = box;
    } catch(err) {
      console.error('getReferenceData is failed.', err);
    } finally {
      postMessage({ done: true, ready: self.ready });
    }
  } else {
    try {
      let [status, eyeClose, box, landmarks] = await inferenceFrame(self.model, self.landmarkModel, frame, self.refData);
      // console.log('inferenceFrame:', status, eyeClose, box, landmarks, frame.shape);
  
      if (self.isSleep.length <= self.patience / 10) {
        self.isSleep.push(eyeClose * 1.0);
      } else {
        self.isSleep.shift();
        self.isSleep.push(eyeClose * 1.0);
        if (tf.mean(self.isSleep).arraySync() > 0.5) {
          status = 1;
        }
      }
  
      postMessage({ done: true, data: { status, eyeClose, box, landmarks }});
    } catch (err) {
      console.error('inferenceFrame is failed.', err);
      postMessage({ done: true });
    }
  }
});