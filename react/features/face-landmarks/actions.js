import 'image-capture';
import './createImageBitmap';
import { AnyAction } from 'redux';

import {
    ADD_FACE_LANDMARKS,
    CLEAR_FACE_LANDMARKS_BUFFER,
    NEW_FACE_COORDINATES
} from './actionTypes';

/**
 * Adds new face landmarks to the timeline.
 *
 * @param {FaceLandmarks} faceLandmarks - The new face landmarks to timeline.
 * @param {boolean} addToBuffer - If true adds the face landmarks to a buffer in the reducer for webhook.
 * @returns {AnyAction}
 */
export function addFaceLandmarks(faceLandmarks, addToBuffer) {
    return {
        type: ADD_FACE_LANDMARKS,
        faceLandmarks,
        addToBuffer
    };
}

/**
 * Clears the face landmarks array in the state.
 *
 * @returns {AnyAction}
 */
export function clearFaceExpressionBuffer() {
    return {
        type: CLEAR_FACE_LANDMARKS_BUFFER
    };
}

/**
 * Signals that a new face box was obtained for the local participant.
 *
 * @param {FaceBox} faceBox - The face box of the local participant.
 * @returns {AnyAction}
 */
export function newFaceBox(faceBox) {
    return {
        type: NEW_FACE_COORDINATES,
        faceBox
    };
}
