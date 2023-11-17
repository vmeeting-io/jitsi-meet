// @flow

import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

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
    console.log('TensorFlow backend:', tf.getBackend());

    const pose_model = poseDetection.SupportedModels.BlazePose;

    let _flipHorizontal = false;
    const detectorConfig = {
        runtime: 'mediapipe',  //'mediapipe' or 'tfjs'
        modelType: 'full',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose'
    };
    const model = await poseDetection.createDetector(pose_model, detectorConfig);
    console.timeEnd('initialize');

    if(detectorConfig.runtime === 'tfjs')
        _flipHorizontal = true;

    const options = {
        flipHorizontal: _flipHorizontal,
        width: 640,
        height: 360,
        view3Dsize: 300,
        poseThres: 0.5,
        pose
    };

    return new JitsiStreamPoseEffect(model, options);
}
