import '@tensorflow/tfjs-backend-cpu';
import * as tf from '@tensorflow/tfjs-core';
import * as tflite from '@tensorflow/tfjs-tflite';

import { MEDIA_TYPE } from '../base/media';
import { getLocalTrack } from '../base/tracks';
import { START_FACE_DETECT, STOP_FACE_DETECT } from './actionTypes';
import { grantFaceDetect } from './functions';
import FaceDetect from './FaceDetect';

const models = {
    model_face_detect: '/libs/retina_face.tflite',
    model_landmark_detect: '/libs/pfld.tflite'
};

let faceDetector;

export function startFaceDetect() {
    return async function(dispatch, getState) {
        const state = getState();
        const localTrack = getLocalTrack(state['features/base/tracks'], MEDIA_TYPE.VIDEO);
        const { started } = state['features/face-detect'];
        const test = !started
        && localTrack
        && localTrack.isVideoTrack()
        && localTrack.videoType !== 'desktop';

        console.log('==> startFaceDetect:', test);
        if (true
            // && await grantFaceDetect(state)
        ) {
            if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
                throw new Error('FaceDetect not supported!');
            }
        
            try {
                const faceDetectModel = await tflite.loadTFLiteModel(models.model_face_detect);
                const landmarkDetectModel = await tflite.loadTFLiteModel(models.model_landmark_detect);
            
                faceDetector = new FaceDetect(faceDetectModel, landmarkDetectModel);
                faceDetector.startEffect();

                dispatch({
                    type: START_FACE_DETECT,
                    started: true
                });
            } catch (err) {
                console.error('createFaceDetect is failed.', err);
            }
        }
    };
}

export function stopFaceDetect() {
    console.log('==> stopFaceDetect');

    faceDetector?.stopEffect()
    faceDetector = null;

    return {
        type: STOP_FACE_DETECT,
        started: false
    };
}
