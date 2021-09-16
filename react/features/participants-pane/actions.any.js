// @flow

import {
    PARTICIPANTS_PANE_CLOSE,
    PARTICIPANTS_PANE_OPEN
} from './actionTypes';

/**
 * Action to close the participants pane.
 *
 * @returns {Object}
 */
export const close = () => {
    return {
        type: PARTICIPANTS_PANE_CLOSE
    };
};

/**
 * Action to open the participants pane.
 *
 * @returns {Object}
 */
export const open = () => {
    return {
        type: PARTICIPANTS_PANE_OPEN
    };
};

/**
 * Action to display notification for starting random selection
 */
export const notifyRandomSelectionStarted = (initiator) => {
    const state = APP.store.getState();
    const { conference } = state['features/base/conference'];
    conference.startRandomSelection(initiator);
};

/**
 * Action to display notification for starting timer
 */
 export const notifyTimerStarted = (initiator) => {
    const state = APP.store.getState();
    const { conference } = state['features/base/conference'];
    conference.startTimer(initiator);
};