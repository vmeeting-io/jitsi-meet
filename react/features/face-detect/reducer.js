// @flow

import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    START_FACE_DETECT,
    STOP_FACE_DETECT,
    ATTENTION_ANALYSIS_OPENED,
    SET_ATTENTION_ANALYSIS_READY,
    INIT_FACE_DETECT,
    SET_ATTENTION_ANALYSIS_COUNT,
    SET_ATTENTION_ANALYSIS_TOTAL,
    SET_STATUS_MAP,
} from './actionTypes';

const DEFAULT_STATE = {
    childWindow: null,
    instance: null,
    statusMap: new Map()
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
    case SET_ATTENTION_ANALYSIS_READY:
    case SET_ATTENTION_ANALYSIS_COUNT:
    case SET_ATTENTION_ANALYSIS_TOTAL:
        return {
            ...state,
            ...data
        };

    case SET_STATUS_MAP:
        return {
            ...state,
            statusMap: new Map(action.statusMap)
        };

    default:
        return state;
    }
});
