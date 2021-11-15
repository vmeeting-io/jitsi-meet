// @flow

import { ReducerRegistry } from '../base/redux';

import {
    UPDATE_ATTENTION_STATUSES,
    START_FACE_DETECT,
    STOP_FACE_DETECT,
} from './actionTypes';

const DEFAULT_STATE = {
    started: false,
    statuses: {}
};

/**
 * Reduces the Redux actions of the feature features/e2ee.
 */
ReducerRegistry.register('features/face-detect', (state = DEFAULT_STATE, action) => {
    const { type, ...data } = action;

    switch (action.type) {
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
