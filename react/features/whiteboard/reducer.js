// @flow

import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    RESET_WHITEBOARD,
    SET_WHITEBOARD_STATUS,
    SET_WHITEBOARD_URL,
    SETUP_WHITEBOARD
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
    isOpen: false,
    collabDetails: undefined
};

/**
 * Reduces the Redux actions of the feature features/whiteboard.
 */
ReducerRegistry.register(
    'features/whiteboard',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case SETUP_WHITEBOARD: {
            return {
                ...state,
                isOpen: true,
                collabDetails: action.collabDetails
            };
        }
        case RESET_WHITEBOARD:
            return DEFAULT_STATE;
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
        }

        return state;
    });
