// @flow

import { ReducerRegistry } from '../base/redux';

import {
    TOGGLE_POSEDEMO,
    TOGGLE_3D_VIEW,
    TOGGLE_VIEW_ON_CAM
} from './actionTypes';

const DEFAULT_STATE = {
    enabled: false,
    view3D: false,
    viewOnCam: false
};

/**
 * Reduces the Redux actions of the feature features/posedemo.
 */
ReducerRegistry.register('features/posedemo', (state = DEFAULT_STATE, action) => {
    const { type, ...data } = action;
    const { enabled } = action;

    switch (action.type) {
    case TOGGLE_POSEDEMO: {
        return {
            ...state,
            enabled
        };
    }

    case TOGGLE_VIEW_ON_CAM:
    case TOGGLE_3D_VIEW: {
        return {
            ...state,
            ...data
        };
    }

    default:
        return state;
    }
});