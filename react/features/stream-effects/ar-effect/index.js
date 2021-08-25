// @flow

import logger from '../../ar-effect/logger';

import { showWarningNotification } from '../../notifications/actions';

import JitsiStreamAREffect from './JitsiStreamAREffect';

import * as tf from '@tensorflow/tfjs'
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

require('@tensorflow/tfjs-backend-webgl');

/**
 * Creates a new instance of JitsiStreamAREffect. This loads the TF.js FaceMesh model that is used to
 * extract keypoints of face.
 *
 * @param {Object} arObj - AR image link
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {Promise<JitsiStreamBackgroundEffect>}
 */
export async function createAREffect(arObj: Object, dispatch: Function) {
    const packageConfig = {
        shouldLoadIrisModel: false,
        detectionConfidence: 0.7,
        maxFaces: 3
    };
    const model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, packageConfig);

    const options = {
        obj: 'images/ar-object/birthday_hat.png',
        src_points: [
            {x: 308, y: 530}, //left
            {x: 692, y: 530}, //right
        ],
        dst_index: [
            21, //left
            251 //right
        ]
    };

    return new JitsiStreamAREffect(model, options);
}
