// @flow

import * as poseDetection from '@tensorflow-models/pose-detection';

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

import JitsiStreamPoseEffect from './JitsiStreamPoseEffect';


/**
 * Creates a new instance of JitsiStreamBackgroundEffect. This loads the Meet background model that is used to
 * extract person segmentation.
 *
 * @param {Object} virtualBackground - The virtual object that contains the background image source and
 * the isVirtualBackground flag that indicates if virtual image is activated.
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {Promise<JitsiStreamBackgroundEffect>}
 */
export async function createPoseEffect(pose: Object, dispatch: Function) {
    if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
        throw new Error('JitsiStreamPoseEffect not supported!');
    }

    console.time('initialize');
    await tf.ready();
    // tf.setBackend('webgl');
    console.log('TensorFlow backend:', tf.getBackend());

    const pose_model = poseDetection.SupportedModels.BlazePose;
    // const detectorConfig = {
    //   runtime: 'tfjs', //'mediapipe' or 'tfjs'
    //   modelType: 'lite'
    // };

    const detectorConfig = {
        runtime: 'mediapipe', //'mediapipe' or 'tfjs'
        modelType: 'lite',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose'
      };

    const model = await poseDetection.createDetector(pose_model, detectorConfig);
    console.timeEnd('initialize');

    const options = {
        flipHorizontal: true,
        pose
    };

    return new JitsiStreamPoseEffect(model, options);
}
