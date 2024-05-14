import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    ADD_FACE_LANDMARKS,
    CLEAR_FACE_LANDMARKS_BUFFER,
    UPDATE_FACE_COORDINATES
} from './actionTypes';

const defaultState = {
    faceBoxes: {},
    faceLandmarks: [],
    faceLandmarksBuffer: [],
    recognitionActive: false
};

ReducerRegistry.register('features/face-landmarks',
(state = defaultState, action) => {
    switch (action.type) {
    case ADD_FACE_LANDMARKS: {
        const { addToBuffer, faceLandmarks } = action;

        return {
            ...state,
            faceLandmarks: [ ...state.faceLandmarks, faceLandmarks ],
            faceLandmarksBuffer: addToBuffer ? [ ...state.faceLandmarksBuffer,
                {
                    emotion: faceLandmarks.faceExpression,
                    timestamp: faceLandmarks.timestamp
                } ] : state.faceLandmarksBuffer
        };
    }
    case CLEAR_FACE_LANDMARKS_BUFFER: {
        return {
            ...state,
            faceLandmarksBuffer: []
        };
    }
    case UPDATE_FACE_COORDINATES: {
        return {
            ...state,
            faceBoxes: {
                ...state.faceBoxes,
                [action.id]: action.faceBox
            }
        };
    }
    }

    return state;
});
