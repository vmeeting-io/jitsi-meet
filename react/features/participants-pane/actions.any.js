// @flow

import {
    PARTICIPANTS_PANE_CLOSE,
    PARTICIPANTS_PANE_OPEN
} from './actionTypes';


import {
    getLocalParticipant,
    getRemoteParticipants
} from '../base/participants';

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
 * Action to randomly select a participant from all participants
 */
export const randomlySelectFromAllParticipants = () => {
    const state = APP.store.getState();

    // get remote participants' IDs and localParticipant's ID
    const remoteParticipantIDs = getRemoteParticipants(state).keys();
    const localParticipantID = getLocalParticipant(state).id;

    // initialize an array to store all participants IDs
    const allParticipantsID = [localParticipantID, ...remoteParticipantIDs]

    // randomly select an ID from allParticipantsID array
    const randomlySelectedID = allParticipantsID[Math.floor(Math.random() * allParticipantsID.length)];

    return randomlySelectedID;

}

/**
 * Action to display notification when completing random selection
 */
export const notifyRandomSelectionCompleted = (selectedParticipantDisplayName) => {
    const state = APP.store.getState();
    const { conference } = state['features/base/conference'];
    conference.finalizeRandomSelection(selectedParticipantDisplayName);
}
