import { isParticipantMediaMuted } from ".";
import { MEDIA_TYPE } from "../media";
import { getParticipantById } from "../participants";

/**
 * Checks if the participant is audio muted.
 *
 * @param {Object} participant - Participant reference.
 * @param {Object} state - Global state.
 * @returns {boolean} - Is audio muted for the participant.
 */
export const selectParticipantAudioMuted = state => participantID => {
    const participant = getParticipantById(state, participantID);
    return isParticipantMediaMuted(participant, MEDIA_TYPE.AUDIO, state);
}

/**
 * Checks if the participant is video muted.
 *
 * @param {Object} participant - Participant reference.
 * @param {Object} state - Global state.
 * @returns {boolean} - Is video muted for the participant.
 */
export const selectParticipantVideoMuted = state => participantID => {
    const participant = getParticipantById(state, participantID);
    return isParticipantMediaMuted(participant, MEDIA_TYPE.VIDEO, state);
}

