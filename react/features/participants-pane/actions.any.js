// @flow

import {
    PARTICIPANTS_PANE_CLOSE,
    PARTICIPANTS_PANE_OPEN
} from './actionTypes';


import {
    getLocalParticipant,
    getRemoteParticipants
} from '../base/participants';

import { COMMAND_TIMER_END_TIME
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
 * 
 * @param {string} initiator Person to put hat on the participant. 
 * @param {string} remoteParticipantIDs Id of the remote participant to
 * wear birthday hat. 
 */
 export const notifyBirthdayHatOn = (initiator,remoteParticipantID) => {
    const state = APP.store.getState();
    const { conference } = state['features/base/conference'];
    conference.notifyBirthdayHatOn(initiator,remoteParticipantID);
};

/**
 * Action to display notification for stopping timer
 */
 export const notifyTimerStarted = (initiator,endUNIXTime) => {
    const state = APP.store.getState();
    const { conference } = state['features/base/conference'];
    conference.startTimer(initiator,endUNIXTime);
    
    // Send message to XMPP module
    conference.sendMessage({
        type: COMMAND_TIMER_END_TIME,
        timerEndTime: endUNIXTime,
        senderName: initiator
    });
};

/**
 * Action to display notification for starting timer
 */
 export const notifyTimerStopped = (initiator) => {
    const state = APP.store.getState();
    const { conference } = state['features/base/conference'];
    conference.stopTimer(initiator);
};

/** 
 * Action to randomly select a participant from all participants
 */
export const randomlySelectFromAllParticipants = () => {
    const state = APP.store.getState();

    // get remote participants' IDs and localParticipant's ID
    const remoteParticipantIDs = getRemoteParticipants(state).keys();

    // initialize an array to store all participants IDs
    // we don't want the initiator/moderator who initiated the function to be included in random selection
    // so we include only remote participants
    const allParticipantsID = [...remoteParticipantIDs];

    // randomly select an ID from allParticipantsID array
    const randomlySelectedID = allParticipantsID[Math.floor(Math.random() * allParticipantsID.length)];

    return randomlySelectedID;

}

/**
 * Action to display notification when completing random selection
 */
export const notifyRandomSelectionCompleted = (selectedParticipantDisplayName, randomParticipantID) => {
    const state = APP.store.getState();
    const { conference } = state['features/base/conference'];
    conference.finalizeRandomSelection(selectedParticipantDisplayName, randomParticipantID);
}
