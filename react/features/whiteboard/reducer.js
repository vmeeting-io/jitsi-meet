// @flow

import { ReducerRegistry } from '../base/redux';

import {
    SET_WHITEBOARD_STATUS,
    SET_WHITEBOARD_URL,
} from './actionTypes';

const DEFAULT_STATE = {

    /**
     * URL for the whiteboard.
     */
    url: undefined,

    /**
     * Whether or not Whiteboard is currently open.
     *
     * @public
     * @type {boolean}
     */
    editing: false,
};

/**
 * Reduces the Redux actions of the feature features/whiteboard.
 */
ReducerRegistry.register(
    'features/whiteboard',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case SET_WHITEBOARD_STATUS:
            return {
                ...state,
                editing: action.editing
            };

        case SET_WHITEBOARD_URL:
            return {
                ...state,
                url: action.url
            };

        default:
            return state;
        }
    });
