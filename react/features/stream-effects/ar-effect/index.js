// @flow

import logger from '../../ar-effect/logger';

import { showWarningNotification } from '../../notifications/actions';

import JitsiStreamAREffect from './JitsiStreamAREffect';

import * as tf from '@tensorflow/tfjs'
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

require('@tensorflow/tfjs-backend-webgl');

/**
 * Creates a new instance of JitsiStreamBackgroundEffect. This loads the Meet background model that is used to
 * extract person segmentation.
 *
 * @param {Object} virtualBackground - The virtual object that contains the background image source and
 * the isVirtualBackground flag that indicates if virtual image is activated.
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {Promise<JitsiStreamBackgroundEffect>}
 */
export async function createAREffect(arObj: Object, dispatch: Function) {
    const packageConfig = {
        shouldLoadIrisModel: false,
        detectionConfidence: 0.7
    };
    const model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, packageConfig);

    const options = {
        mesh: arObj
    };

    return new JitsiStreamAREffect(model, options);
}
