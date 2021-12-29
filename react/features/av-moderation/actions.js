// @flow

import { getConferenceState } from '../base/conference';
import { MEDIA_TYPE, type MediaType } from '../base/media/constants';
import { getParticipantById, isParticipantModerator } from '../base/participants';
import { isForceMuted } from '../participants-pane/functions';

import {
    DISMISS_PENDING_PARTICIPANT,
    DISABLE_MODERATION,
    ENABLE_MODERATION,
    LOCAL_PARTICIPANT_APPROVED,
    LOCAL_PARTICIPANT_MODERATION_NOTIFICATION,
    PARTICIPANT_APPROVED,
    PARTICIPANT_PENDING_AUDIO,
    REQUEST_DISABLE_MODERATION,
    REQUEST_ENABLE_MODERATION,
    LOCAL_PARTICIPANT_REJECTED,
    PARTICIPANT_REJECTED
} from './actionTypes';
import { isEnabledFromState } from './functions';

/**
 * Action used by moderator to approve audio for a participant.
 *
 * @param {staring} id - The id of the participant to be approved.
 * @returns {void}
 */
export const approveParticipantAudio = (id: string) => (dispatch: Function, getState: Function) => {
    const state = getState();
    const { conference } = getConferenceState(state);
    const participant = getParticipantById(state, id);

    const isAudioModerationOn = isEnabledFromState(MEDIA_TYPE.AUDIO, state);
    const isVideoModerationOn = isEnabledFromState(MEDIA_TYPE.VIDEO, state);
    const isVideoForceMuted = isForceMuted(participant, MEDIA_TYPE.VIDEO, state);

    if (isAudioModerationOn || !isVideoModerationOn || !isVideoForceMuted) {
        conference.avModerationApprove(MEDIA_TYPE.AUDIO, id);
    }
};

/**
 * Action used by moderator to approve video for a participant.
 *
 * @param {staring} id - The id of the participant to be approved.
 * @returns {void}
 */
export const approveParticipantVideo = (id: string) => (dispatch: Function, getState: Function) => {
    const state = getState();
    const { conference } = getConferenceState(state);
    const participant = getParticipantById(state, id);

    const isVideoForceMuted = isForceMuted(participant, MEDIA_TYPE.VIDEO, state);
    const isVideoModerationOn = isEnabledFromState(MEDIA_TYPE.VIDEO, state);

    if (isVideoModerationOn && isVideoForceMuted) {
        conference.avModerationApprove(MEDIA_TYPE.VIDEO, id);
    }
};

/**
 * Action used by moderator to approve audio and video for a participant.
 *
 * @param {staring} id - The id of the participant to be approved.
 * @returns {void}
 */
export const approveParticipant = (id: string) => (dispatch: Function) => {
    dispatch(approveParticipantAudio(id));
    dispatch(approveParticipantVideo(id));
};

/**
 * Action used by moderator to reject audio for a participant.
 *
 * @param {staring} id - The id of the participant to be rejected.
 * @returns {void}
 */
export const rejectParticipantAudio = (id: string) => (dispatch: Function, getState: Function) => {
    const state = getState();
    const { conference } = getConferenceState(state);
    const audioModeration = isEnabledFromState(MEDIA_TYPE.AUDIO, state);

    const participant = getParticipantById(state, id);
    const isAudioForceMuted = isForceMuted(participant, MEDIA_TYPE.AUDIO, state);
    const isModerator = isParticipantModerator(participant);

    if (audioModeration && !isAudioForceMuted && !isModerator) {
        conference.avModerationReject(MEDIA_TYPE.AUDIO, id);
    }
};

/**
 * Action used by moderator to reject video for a participant.
 *
 * @param {staring} id - The id of the participant to be rejected.
 * @returns {void}
 */
export const rejectParticipantVideo = (id: string) => (dispatch: Function, getState: Function) => {
    const state = getState();
    const { conference } = getConferenceState(state);
    const videoModeration = isEnabledFromState(MEDIA_TYPE.VIDEO, state);

    const participant = getParticipantById(state, id);
    const isVideoForceMuted = isForceMuted(participant, MEDIA_TYPE.VIDEO, state);
    const isModerator = isParticipantModerator(participant);

    if (videoModeration && !isVideoForceMuted && !isModerator) {
        conference.avModerationReject(MEDIA_TYPE.VIDEO, id);
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
 * Local participant was blocked to be able to unmute audio and video.
 *
 * @param {MediaType} mediaType - The media type to disable.
 * @returns {{
 *     type: LOCAL_PARTICIPANT_REJECTED
 * }}
 */
export const localParticipantRejected = (mediaType: MediaType) => {
    return {
        type: LOCAL_PARTICIPANT_REJECTED,
        mediaType
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

