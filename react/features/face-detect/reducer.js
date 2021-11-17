// @flow

import { ReducerRegistry } from '../base/redux';

import {
    UPDATE_ATTENTION_STATUSES,
    START_FACE_DETECT,
    STOP_FACE_DETECT,
    ATTENTION_ANALYSIS_OPENED,
} from './actionTypes';

const DEFAULT_STATE = {
    childWindow: null,
    started: false,
};

/**
 * Reduces the Redux actions of the feature features/e2ee.
 */
ReducerRegistry.register('features/face-detect', (state = DEFAULT_STATE, action) => {
    const { type, ...data } = action;

    switch (action.type) {
    case ATTENTION_ANALYSIS_OPENED:
    case START_FACE_DETECT:
    case STOP_FACE_DETECT:
    case UPDATE_ATTENTION_STATUSES:
        return {
            ...state,
            ...data
        };

    default:
        return state;
    }
});
