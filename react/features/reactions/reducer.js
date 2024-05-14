// @flow

import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    ADD_REACTION_BUFFER,
    FLUSH_REACTION_BUFFER,
    SET_REACTION_QUEUE,
    SHOW_SOUNDS_NOTIFICATION,
    TOGGLE_REACTIONS_VISIBLE
} from './actionTypes';

/**
 * Returns initial state for reactions' part of Redux store.
 *
 * @private
 * @returns {{
 *     visible: boolean,
 *     message: string,
 *     timeoutID: number,
 *     queue: Array,
 *     notificationDisplayed: boolean
 * }}
 */
function _getInitialState() {
    return {
        visible: false,
        buffer: [],
        timeoutID: null,
        queue: [],
        notificationDisplayed: false
    };
}

ReducerRegistry.register(
    'features/reactions',
    (state: Object = _getInitialState(), action: Object) => {
        switch (action.type) {

        case TOGGLE_REACTIONS_VISIBLE:
            return {
                ...state,
                visible: !state.visible
            };

        case ADD_REACTION_BUFFER:
            return {
                ...state,
                buffer: action.buffer ?? [],
                timeoutID: action.timeoutID ?? null
            };

        case FLUSH_REACTION_BUFFER:
            return {
                ...state,
                buffer: [],
                timeoutID: null
            };

        case SET_REACTION_QUEUE: {
            return {
                ...state,
                queue: action.queue ?? []
            };
        }

        case SHOW_SOUNDS_NOTIFICATION: {
            return {
                ...state,
                notificationDisplayed: true
            };
        }
        }

        return state;
    });
