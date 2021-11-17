import * as tf from '@tensorflow/tfjs';
import { isEqual } from 'lodash';

import { getReferenceData, inferenceFrame } from './utils/utils';

const models = {
  model_face_detect: '/libs/retinaface.json',
  model_landmark_detect: '/libs/pfld.json'
};

addEventListener('message', async event => {
  const { command, data } = event.data;

  if (command === 'initialize') {
    const { patience } = data;

    self.nFrame = 1;
    self.patience = patience || 1000;
    self.refData = [];
    self.prevBox = [0, 0, 0, 0];
    self.isSleep = [];
    self.faceDetectModel = await tf.loadGraphModel(models.model_face_detect);
    self.landmarkDetectModel = await tf.loadGraphModel(models.model_landmark_detect);

    console.time('get references');
    postMessage({ done: true, data: 'initialized' });
    return;
  }

  const frame = tf.browser.fromPixels(data);
  if (!frame || !frame.shape[0] || !frame.shape[1]) {
      console.error('ERROR: runInference is failed');
      return;
  }
  // console.log('frame.shape:', frame.shape);

  if (self.nFrame <= self.patience) {
    try {
      const [data, ret, box] = await getReferenceData(self.faceDetectModel, self.landmarkDetectModel, frame);
      // console.log('getReferenceData:', data, ret, box);
  
      if (ret && !isEqual(box, self.prevBox)) {
        self.refData.push(data);
        self.nFrame += 1;
      }
      self.prevBox = box;
    } catch(err) {
      console.error('getReferenceData is failed.', err);
    } finally {
      postMessage({ done: true });
    }

    if (self.nFrame > self.patience) {
      console.timeEnd('get references');
    }
  } else {
    try {
      let [status, eyeClose, box, landmarks] = await inferenceFrame(self.faceDetectModel, self.landmarkDetectModel, frame, self.refData);
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