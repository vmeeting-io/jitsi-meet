// @flow

import { ReducerRegistry } from '../base/redux';

import {
    UPDATE_ATTENTION_STATUSES,
    START_FACE_DETECT,
    STOP_FACE_DETECT,
    ATTENTION_ANALYSIS_OPENED,
    SET_ATTENTION_ANALYSIS_READY,
    INIT_FACE_DETECT,
    SET_ATTENTION_ANALYSIS_COUNT,
    SET_ATTENTION_ANALYSIS_TOTAL,
} from './actionTypes';

const DEFAULT_STATE = {
    childWindow: null,
    instance: null,
};

/**
 * Reduces the Redux actions of the feature features/e2ee.
 */
ReducerRegistry.register('features/face-detect', (state = DEFAULT_STATE, action) => {
    const { type, ...data } = action;

    switch (action.type) {
    case INIT_FACE_DETECT:
    case ATTENTION_ANALYSIS_OPENED:
    case START_FACE_DETECT:
    case STOP_FACE_DETECT:
    case UPDATE_ATTENTION_STATUSES:
    case SET_ATTENTION_ANALYSIS_READY:
    case SET_ATTENTION_ANALYSIS_COUNT:
    case SET_ATTENTION_ANALYSIS_TOTAL:
        return {
            ...state,
            ...data
        };

    default:
        return state;
    }
});
