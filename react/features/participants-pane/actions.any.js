// @flow

import { PARTICIPANTS_PANE_CLOSE } from './actionTypes';

import {
    COMMAND_CLEAR_RAISED_HANDS,
    COMMAND_TIMER_END_TIME
} from './constants';

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
 * Action to display notification for starting random selection
 */
export const notifyRandomSelectionStarted = (initiator) => {
    return function(dispatch, getState) {
        const state = getState();
        const { conference } = state['features/base/conference'];
        conference.startRandomSelection(initiator);
    };
};

/**
 * 
 * @param {string} initiator Person to put hat on the participant. 
 * @param {string} remoteParticipantIDs Id of the remote participant to
 * wear birthday hat. 
 */
export const notifyBirthdayHatOn = (initiator,remoteParticipantID) => {
    return function(dispatch, getState) {
        const { conference } = getState()['features/base/conference'];
        conference.notifyBirthdayHatOn(initiator,remoteParticipantID);
    };
};

/**
 * Action to display notification for stopping timer
 */
export const notifyTimerStarted = (initiator,endUNIXTime) => {
    return function(dispatch, getState) {
        const { conference } = getState()['features/base/conference'];
        conference.startTimer(initiator,endUNIXTime);
        
        // Send message to XMPP module
        conference.sendMessage({
            type: COMMAND_TIMER_END_TIME,
            timerEndTime: endUNIXTime,
            senderName: initiator
        });
    };
};

/**
 * Action to display notification for starting timer
 */
export const notifyTimerStopped = (initiator) => {
    return function(dispatch, getState) {
        const { conference } = getState()['features/base/conference'];
        conference.stopTimer(initiator);
    };
};

/**
 * Action to display notification when completing random selection
 */
export const notifyRandomSelectionCompleted = (selectedParticipantDisplayName, randomParticipantID) => {
    return function(dispatch, getState) {
        const { conference } = getState()['features/base/conference'];
        conference.finalizeRandomSelection(selectedParticipantDisplayName, randomParticipantID);
    };
}

/**
 * Action to clear raised hands
 */
export const clearRaisedHands = () => {
    return function(_, getState) {
        const { conference } = getState()['features/base/conference'];
        
        // Send message to XMPP module
        conference.sendMessage({ type: COMMAND_CLEAR_RAISED_HANDS });
    };
};
