'use strict';

import * as tf from '@tensorflow/tfjs';
import { isEqual, map } from 'lodash';

import RetinaFaceModel from './RetinaFaceModel';
import BlinkModel from './BlinkModel';
import { normalize_frame } from './utils/utils';

import {
  calc_BB_area,
  check_large_pose_from_ref,
  get_thetas,
} from './utils/utils';

async function getReferenceData(model, frame) {
  let [faces, landmarks ] = await model.detect(frame, 0.5, 1.0);
  // console.log('getReferenceData: output=', output);

  if (faces.shape[0] > 0) {
    faces = faces.unstack();
    const areas = faces.map(face => calc_BB_area(face));
    const max = Math.max(...areas);

    if (max <= frame.shape[0] * frame.shape[1] * 0.01) {
      return [ null, 0, [0, 0, 0, 0] ];
    } else {
      const maxIndex = areas.indexOf(max);

      // console.log('getReferenceData:', areas, maxIndex);
      // faces[maxIndex].print();
      const box = faces[maxIndex]
        .round()
        .asType('int32')
        .clipByValue(0, Number.MAX_VALUE).arraySync();

      const landmark5 = landmarks.arraySync();
      const thetas = get_thetas(landmark5[maxIndex], box.slice(0, 4));

      return [ { landmark5, thetas }, 1, box ];
    }
  } else {
    return [ null, 0, [0, 0, 0, 0] ];
  }
}

function crop_eyes(frame, box, landmark5) {
  const bbox_width  = Math.round((box[2] - box[0])/6.0);
  const bbox_height = Math.round((box[3] - box[1])/6.0);

  const LE = landmark5[0];
  const RE = landmark5[1];
  
  // console.log('bbox_width:', bbox_width, 'bbox_height:', bbox_height, 'LE:', LE, 'RE:', RE);
  let left_eye;
  let right_eye;
  try {
    // left_eye = frame[LE[1]-bbox_height:LE[1]+bbox_height, LE[0]-bbox_width:LE[0]+bbox_width,:]
    left_eye  = frame.slice(
      [LE[1]-bbox_height, LE[0]-bbox_width, 0],
      [bbox_height*2, bbox_width*2, frame.shape[2]]
    );
    // right_eye = frame[RE[1]-bbox_height:RE[1]+bbox_height, RE[0]-bbox_width:RE[0]+bbox_width,:]
    right_eye = frame.slice(
      [RE[1]-bbox_height, RE[0]-bbox_width, 0],
      [bbox_height*2, bbox_width*2, frame.shape[2]]
    );

    const result = [
      tf.image.resizeBilinear(left_eye, [96, 96], true),
      tf.image.resizeBilinear(right_eye, [96, 96], true)
    ];
    // console.log('crop_eye:', result[0].print(), result[1].print());
    return result;
  } catch (e) {
    left_eye = tf.zeros([96, 96, 3]);
    right_eye = tf.zeros([96, 96, 3]);
    return [left_eye, right_eye];
  }
}

async function inferenceFrame(model, blinkModel, frame, refData) {
  let [ faces, landmarks ] = await model.detect(frame, 0.5, 1.0);

  let eyeClose = false;
  let box = [0, 0, 0, 0];
  let status = 0;
  let landmark5 = [];

  frame = tf.image.resizeBilinear(frame, [640, 640], true);
  // 얼굴이 검출되면
  if (faces.shape[0] > 0) {
    faces = faces.unstack();
    const areas = faces.map(face => calc_BB_area(face));
    const max = Math.max(...areas);
    
    // console.log('face max area:', max, maxIndex);
    if (max <= frame.shape[0] * frame.shape[1] * 0.01) {
      status = 2;
    } else {
      const maxIndex = areas.indexOf(max);
      box = faces[maxIndex]
        .round()
        .asType('int32')
        .clipByValue(0, Number.MAX_VALUE).arraySync();

      landmark5 = landmarks.gather(maxIndex).asType('int32').arraySync();
      const avgThetas = tf.mean(map(refData, 'thetas'), 0).arraySync();
      const refRatioLR = (avgThetas[0] + avgThetas[6]) / (avgThetas[1] + avgThetas[7]);
      const refRatioUD = (avgThetas[2] + avgThetas[3]) / (avgThetas[4] + avgThetas[5]);

      const ret = check_large_pose_from_ref(landmark5, box.slice(0, 4), refRatioLR, refRatioUD);
      // console.log('check_large_pose_from_ref:', ret);

      status = ret === 0 ? 0 : 1; // 집중(0), 비집중(1) 여부

      const [LE, RE] = crop_eyes(frame, box, landmark5)
      const probs = await blinkModel.predict(LE.expandDims(0),RE.expandDims(0));
      eyeClose = probs.greaterEqual(blinkModel.threshold).arraySync();
      eyeClose = eyeClose[0][0];
      // console.log('eyeClose:', eyeClose, probs.toString());

      // const concat = tf.concat([LE, RE], 1);
      // cv2.imshow('probs', concat)
      // text = str(eye_close)
      // org = (box[2], int((box[1] + box[3]) / 2))
      // font = cv2.FONT_HERSHEY_SIMPLEX
      // cv2.putText(frame, text, org, font, 1, (255, 0, 0), 2)

      // if (show_result) {
        // box_color = (0, 0, 255)  // box 색깔
        // cv2.rectangle(frame, (box[0], box[1]), (box[2], box[3]), box_color, 2)

        // for l in range(landmark5.shape[0]):
        //   color = (0, 0, 255)
        //   cv2.circle(frame, (landmark5[l][0], landmark5[l][1]), 1, color, 2)

        // font = cv2.FONT_HERSHEY_SIMPLEX
        // cv2.putText(frame, "eye_close: " + str(eye_close), (20, 20), font, 0.5, (255, 0, 0), 2)
      // }
    }
  } else {
    status = 2;
  }

  return [status, eyeClose, box, landmark5];
}

addEventListener('message', async event => {
  const { command, data } = event.data;
  // console.log('worker:', command, data);

  if (command === 'initialize') {
    console.time('initialize');
    self.refData = [];
    self.prevBox = [0, 0, 0, 0];
    self.isSleep = [];
    self.patience = event.data.patience || 20;
    self.model = new RetinaFaceModel();
    self.model.prepare(0.4);
    // self.landmarkModel = await tf.loadGraphModel('/libs/pfld.json');
    console.timeEnd('initialize');

    postMessage({ done: true, data: 'initialized' });
    return;
  } else if (command === 'inference') {
    try {
      console.time('get references');
      for (let i = 0; i < data.length; i += 1) {
        console.time(`getReferenceData:${i}`);
        // console.log('frame.shape', frame.shape);
        // const resized = tf.image.resizeBilinear(frame, [180, 320], true)
        const frame = tf.browser.fromPixels(data[i]);
        const [landmark5, ret, box] = await getReferenceData(self.model, frame);
        console.timeEnd(`getReferenceData:${i}`);
        // console.log('getReferenceData:', result);
    
        if (ret && !isEqual(box, self.prevBox)) {
          self.refData.push(landmark5);
        }
        self.prevBox = box;
      }
      console.timeEnd('get references');
    } catch(err) {
      console.error('getReferenceData is failed.', err);
    } finally {
      postMessage({ done: true, data: 'started' });
    }
  } else {
    try {
      let frame = tf.browser.fromPixels(data);
      if (!frame || !frame.shape[0] || !frame.shape[1]) {
          console.error('runInference is failed. frame is empty');
          postMessage({ done: true });
          return;
      }
      // console.log('frame.shape:', frame.shape);
    
      if (!self.blinkModel) {
        self.blinkModel = new BlinkModel(0.425);
      }

      let [status, eyeClose, box, landmarks] = await inferenceFrame(self.model, self.blinkModel, frame, self.refData);
      // console.log('inferenceFrame:', status, eyeClose, box, landmarks, frame.shape);

      if (status === 0 && eyeClose) {
        status = 1;
      }

      postMessage({ done: true, data: { status, eyeClose, box, landmarks }});
    } catch (err) {
      console.error('inferenceFrame is failed.', err);
      postMessage({ done: true });
    }
  }
});