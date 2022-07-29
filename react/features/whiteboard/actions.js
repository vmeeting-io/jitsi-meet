// @flow

import {
    SET_WHITEBOARD_STATUS,
    SET_WHITEBOARD_URL,
    TOGGLE_WHITEBOARD
} from './actionTypes';

/**
 * Dispatches an action to set whether whiteboard has started or stopped.
 *
 * @param {boolean} editing - Whether or not a whiteboard is currently being
 * edited.
 * @returns {{
 *    type: SET_WHITEBOARD_STATUS,
 *    editing: boolean
 * }}
 */
export function setWhiteboardState(editing: boolean) {
    return {
        type: SET_WHITEBOARD_STATUS,
        editing
    };
}

/**
 * Dispatches an action to set the whiteboard URL.
 *
 * @param {string} url - The whiteboard URL.
 * @returns {{
 *    type: SET_WHITEBOARD_URL,
 *    url: string
 * }}
 */
export function setWhiteboardUrl(url: ?string) {
    return {
        type: SET_WHITEBOARD_URL,
        url
    };
}

/**
 * Dispatches an action to show or hide Whiteboard.
 *
 * @returns {{
 *    type: TOGGLE_WHITEBOARD
 * }}
 */
export function toggleWhiteboard() {
    return {
        type: TOGGLE_WHITEBOARD
    };
}
