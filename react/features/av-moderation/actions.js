// @flow

import { getConferenceState } from '../base/conference/functions';
import { MEDIA_TYPE } from '../base/media/constants';
import { getParticipantById, isParticipantModerator } from '../base/participants/functions';
import { isForceMuted } from '../participants-pane/functions';

import {
    DISABLE_MODERATION,
    DISMISS_PENDING_PARTICIPANT,
    ENABLE_MODERATION,
    LOCAL_PARTICIPANT_APPROVED,
    LOCAL_PARTICIPANT_MODERATION_NOTIFICATION,
    LOCAL_PARTICIPANT_REJECTED,
    PARTICIPANT_APPROVED,
    PARTICIPANT_PENDING_AUDIO,
    PARTICIPANT_REJECTED,
    REQUEST_DISABLE_MODERATION,
    REQUEST_ENABLE_MODERATION
} from './actionTypes';
import { isEnabledFromState } from './functions';

/**
 * Action used by moderator to approve kind for a participant.
 *
 * @param {staring} id - The id of the participant to be approved.
 * @param {staring} kind - The kind to be approved.
 * @returns {void}
 */
export const approveParticipant = (id: string, kind: string) => (dispatch: Function, getState: Function) => {
    const state = getState();
    const { conference } = getConferenceState(state);
    const participant = getParticipantById(state, id);

    const isModerationOn = isEnabledFromState(kind, state);
    const forceMuted = isForceMuted(participant, kind, state);

    if (isModerationOn || !forceMuted) {
        conference.avModerationApprove(kind, id);
    }
};

/**
 * Action used by moderator to reject audio for a participant.
 *
 * @param {staring} id - The id of the participant to be rejected.
 * @param {staring} kind - The kind to be rejected.
 * @returns {void}
 */
export const rejectParticipant = (id: string, kind: string) => (dispatch: Function, getState: Function) => {
    const state = getState();
    const { conference } = getConferenceState(state);
    const participant = getParticipantById(state, id);
    
    const isModerationOn = isEnabledFromState(kind, state);
    const forceMuted = isForceMuted(participant, kind, state);
    const isModerator = isParticipantModerator(participant);

    if (isModerationOn && !forceMuted && !isModerator) {
        conference.avModerationReject(kind, id);
    }
};

/**
 * Audio or video moderation is disabled.
 *
 * @param {string} kind - The moderation kind that was disabled.
 * @param {JitsiParticipant} actor - The actor disabling.
 * @returns {{
 *     type: DISABLE_MODERATION
 * }}
 */
export const disableModeration = (kind: string, actor: Object) => {
    return {
        type: DISABLE_MODERATION,
        kind,
        actor
    };
};


/**
 * Hides the notification with the participant that asked to unmute audio.
 *
 * @param {Object} participant - The participant for which the notification to be hidden.
 * @returns {Object}
 */
export function dismissPendingAudioParticipant(participant: Object) {
    return dismissPendingParticipant(participant.id, MEDIA_TYPE.AUDIO);
}

/**
 * Hides the notification with the participant that asked to unmute.
 *
 * @param {string} id - The participant id for which the notification to be hidden.
 * @param {string} kind - The moderation kind.
 * @returns {Object}
 */
export function dismissPendingParticipant(id: string, kind: string) {
    return {
        type: DISMISS_PENDING_PARTICIPANT,
        id,
        kind
    };
}

/**
 * moderation is enabled.
 *
 * @param {string} kind - The moderation kind that was enabled.
 * @param {JitsiParticipant} actor - The actor enabling.
 * @returns {{
 *     type: ENABLE_MODERATION
 * }}
 */
export const enableModeration = (kind: string, actor: Object) => {
    return {
        type: ENABLE_MODERATION,
        kind,
        actor
    };
};

/**
 * Requests disable of moderation.
 *
 * @param {string} kind - The moderation kind to disable.
 * @returns {{
 *     type: REQUEST_DISABLE_MODERATION
 * }}
 */
export const requestDisableModeration = (kind: string) => {
    return {
        type: REQUEST_DISABLE_MODERATION,
        kind
    };
};

/**
 * Requests enable of moderation.
 *
 * @param {string} kind - The moderation kind to enable.
 * @returns {{
 *     type: REQUEST_ENABLE_MODERATION
 * }}
 */
export const requestEnableModeration = (kind: string) => {
    return {
        type: REQUEST_ENABLE_MODERATION,
        kind
    };
};

/**
 * Local participant was approved to be able to unmute audio and video.
 *
 * @param {string} kind - The moderation kind to disable.
 * @returns {{
 *     type: LOCAL_PARTICIPANT_APPROVED
 * }}
 */
export const localParticipantApproved = (kind: string) => {
    return {
        type: LOCAL_PARTICIPANT_APPROVED,
        kind
    };
};

/**
 * Local participant was blocked to be able to unmute audio and video.
 *
 * @param {string} kind - The moderation kind to disable.
 * @returns {{
 *     type: LOCAL_PARTICIPANT_REJECTED
 * }}
 */
export const localParticipantRejected = (kind: string) => {
    return {
        type: LOCAL_PARTICIPANT_REJECTED,
        kind
    };
};

/**
 * Shows notification when A/V moderation is enabled and local participant is still not approved.
 *
 * @param {string} kind - moderation kind.
 * @returns {Object}
 */
export function showModeratedNotification(kind: string) {
    return {
        type: LOCAL_PARTICIPANT_MODERATION_NOTIFICATION,
        kind
    };
}

/**
 * Shows a notification with the participant that asked to audio unmute.
 *
 * @param {Object} participant - The participant for which is the notification.
 * @returns {Object}
 */
export function participantPendingAudio(participant: Object) {
    return {
        type: PARTICIPANT_PENDING_AUDIO,
        participant
    };
}

/**
 * A participant was approved to unmute for a kind of moderation.
 *
 * @param {string} id - The id of the approved participant.
 * @param {string} kind - The kind of moderation which was approved.
 * @returns {{
 *     type: PARTICIPANT_APPROVED,
 * }}
 */
export function participantApproved(id: string, kind: string) {
    return {
        type: PARTICIPANT_APPROVED,
        id,
        kind
    };
}

/**
 * A participant was blocked to unmute for a kind of moderation.
 *
 * @param {string} id - The id of the approved participant.
 * @param {string} kind - The kind of moderation which was approved.
 * @returns {{
 *     type: PARTICIPANT_REJECTED,
 * }}
 */
export function participantRejected(id: string, kind: string) {
    return {
        type: PARTICIPANT_REJECTED,
        id,
        kind
    };
}

