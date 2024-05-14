/**
 * Close the whiteboard collaboration session.
 * {{
 *      type: RESET_WHITEBOARD
 * }}
 */
export const RESET_WHITEBOARD = 'RESET_WHITEBOARD';

/**
 * Configure the whiteboard collaboration details.
 * {{
 *      type: SETUP_WHITEBOARD,
 *      collabDetails
 * }}
 */
 export const SETUP_WHITEBOARD = 'SETUP_WHITEBOARD';

/**
 * Sets the whiteboard visibility state.
 * {{
 *      type: SET_WHITEBOARD_OPEN,
 *      isOpen
 * }}
 */
export const SET_WHITEBOARD_OPEN = 'SET_WHITEBOARD_OPEN';

/**
 * The type of the action which signals whiteboard has stopped or started.
 *
 * {
 *     type: SET_WHITEBOARD_STATUS
 * }
 */
export const SET_WHITEBOARD_STATUS = 'SET_WHITEBOARD_STATUS';

/**
 * The type of the action which updates the whiteboard URL.
 *
 * {
 *     type: SET_WHITEBOARD_URL
 * }
 */
export const SET_WHITEBOARD_URL = 'SET_WHITEBOARD_URL';

/**
 * The type of the action which signals to start or stop editing a whiteboard.
 *
 * {
 *     type: TOGGLE_WHITEBOARD
 * }
 */
export const TOGGLE_WHITEBOARD = 'TOGGLE_WHITEBOARD';
