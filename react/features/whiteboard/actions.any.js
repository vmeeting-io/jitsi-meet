// @flow
import { showWarningNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import {
    RESET_WHITEBOARD,
    SETUP_WHITEBOARD,
    SET_WHITEBOARD_OPEN,
    SET_WHITEBOARD_STATUS,
    SET_WHITEBOARD_URL,
    TOGGLE_WHITEBOARD
} from './actionTypes';

/**
 * Configures the whiteboard collaboration details.
 *
 * @param {Object} payload - The whiteboard settings.
 * @returns {{
 *     type: SETUP_WHITEBOARD,
 *     collabDetails: { roomId: string, roomKey: string }
 * }}
 */
export const setupWhiteboard = ({ collabDetails }) => {
    return {
        type: SETUP_WHITEBOARD,
        collabDetails
    };
};

/**
 * Cleans up the whiteboard collaboration settings.
 * To be used only on native for cleanup in between conferences.
 *
 * @returns {{
 *     type: RESET_WHITEBOARD
 * }}
 */
export const resetWhiteboard = () => {
    return { type: RESET_WHITEBOARD };
};

/**
 * Sets the whiteboard visibility status.
 *
 * @param {boolean} isOpen - The whiteboard visibility flag.
 * @returns {{
 *      type: SET_WHITEBOARD_OPEN,
 *      isOpen
 * }}
 */
export const setWhiteboardOpen = (isOpen) => {
    return {
        type: SET_WHITEBOARD_OPEN,
        isOpen
    };
};

/**
 * Shows a warning notification about the whiteboard user limit.
 *
 * @returns {Function}
 */
export const notifyWhiteboardLimit = () => (dispatch) => {
    dispatch(showWarningNotification({
        titleKey: 'notify.whiteboardLimitTitle',
        descriptionKey: 'notify.whiteboardLimitDescription'
    }, NOTIFICATION_TIMEOUT_TYPE.LONG));
};

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
