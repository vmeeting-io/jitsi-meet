// @flow

import { ReducerRegistry } from '../base/redux';

import {
    START_FACE_DETECT,
    STOP_FACE_DETECT,
} from './actionTypes';

const DEFAULT_STATE = {
    started: false
};

/**
 * Reduces the Redux actions of the feature features/e2ee.
 */
ReducerRegistry.register('features/face-detect', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case START_FACE_DETECT:
    case STOP_FACE_DETECT:
        return {
            ...state,
            ...action
        };

    default:
        return state;
    }
});
