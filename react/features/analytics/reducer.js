// @flow

import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    SET_INITIALIZED,
    SET_INITIAL_PERMANENT_PROPERTIES,
    UPDATE_LOCAL_TRACKS_DURATION
} from './actionTypes';

/**
 * Initial state.
 */
const DEFAULT_STATE = {
    isInitialized: false,
    initialPermanentProperties: {},
    localTracksDuration: {
        audio: {
            startedTime: -1,
            value: 0
        },
        video: {
            camera: {
                startedTime: -1,
                value: 0
            },
            desktop: {
                startedTime: -1,
                value: 0
            }
        },
        conference: {
            startedTime: -1,
            value: 0
        }
    }
};

/**
 * Listen for actions which changes the state of the analytics feature.
 *
 * @param {Object} state - The Redux state of the feature features/analytics.
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @returns {Object}
 */
ReducerRegistry.register('features/analytics', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case SET_INITIALIZED:
        return {
            ...state,
            initialPermanentProperties: action.value ? state.initialPermanentProperties : {},
            isInitialized: action.value
        };
    case SET_INITIAL_PERMANENT_PROPERTIES:
        return {
            ...state,
            initialPermanentProperties: {
                ...state.initialPermanentProperties,
                ...action.properties
            }
        };
    case UPDATE_LOCAL_TRACKS_DURATION:
        return {
            ...state,
            localTracksDuration: action.localTracksDuration
        };
    default:
        return state;
    }
});
