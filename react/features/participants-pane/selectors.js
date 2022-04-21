import { getRemoteParticipants } from '../base/participants/functions';

/** 
 * Action to randomly select a participant from all participants
 */
export const randomlySelectFromAllParticipants = state => {
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
