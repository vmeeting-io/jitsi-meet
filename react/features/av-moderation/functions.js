// @flow

import { isLocalParticipantModerator } from '../base/participants/functions';

/**
 * Returns this feature's root state.
 *
 * @param {Object} state - Global state.
 * @returns {Object} Feature state.
 */
const getState = state => state['features/av-moderation'];

/**
 * We use to construct once the empty array so we can keep the same instance between calls
 * of getParticipantsAskingToAudioUnmute.
 *
 * @type {*[]}
 */
const EMPTY_ARRAY = [];

/**
 * Returns whether moderation is enabled per kind.
 *
 * @param {string} kind - The kind to check.
 * @param {Object} state - Global state.
 * @returns {null|boolean|*}
 */
export const isEnabledFromState = (kind: string, state: Object) =>
    getState(state)?.moderationEnabled[kind] === true;

/**
 * Returns whether moderation is enabled per kind.
 *
 * @param {string} kind - The kind to check.
 * @returns {null|boolean|*}
 */
export const isEnabled = (kind: string) => (state: Object) => isEnabledFromState(kind, state);

/**
 * Returns whether moderation is supported by the backend.
 *
 * @returns {null|boolean}
 */
export const isSupported = () => (state: Object) => {
    const { conference } = state['features/base/conference'];

    return conference ? conference.isAVModerationSupported() : false;
};

/**
 * Returns whether local participant is approved to unmute a kind.
 *
 * @param {string} kind - The kind to check.
 * @param {Object} state - Global state.
 * @returns {boolean}
 */
export const isLocalParticipantApprovedFromState = (kind: string, state: Object) => {
    const approved = getState(state).unmuteApproved[kind] === true;

    return approved || isLocalParticipantModerator(state);
};

/**
 * Returns whether local participant is approved to unmute a kind.
 *
 * @param {string} kind - The kind to check.
 * @returns {null|boolean|*}
 */
export const isLocalParticipantApproved = (kind: string) =>
    (state: Object) =>
        isLocalParticipantApprovedFromState(kind, state);

/**
 * Returns a selector creator which determines if the participant is approved or not for a kind.
 *
 * @param {string} id - The participant id.
 * @param {string} kind - The kind to check.
 * @returns {boolean}
 */
export const isParticipantApproved = (id: string, kind: string) => (state: Object) => {
    return Boolean(getState(state).whitelist[kind][id]);
};

/**
 * Returns a selector creator which determines if the participant is pending or not for a kind.
 *
 * @param {Participant} participant - The participant.
 * @param {string} kind - The kind to check.
 * @returns {boolean}
 */
export const isParticipantPending = (participant: Object, kind: string) => (state: Object) => {
    const arr = getState(state).pending[kind];

    return Boolean(arr.find(pending => pending.id === participant.id));
};

/**
 * Selector which returns a list with all the participants asking to audio unmute.
 * This is visible ony for the moderator.
 *
 * @param {Object} state - The global state.
 * @returns {Array<Object>}
 */
export const getParticipantsAskingToAudioUnmute = (state: Object) => {
    if (isLocalParticipantModerator(state)) {
        return getState(state).pendingAudio;
    }

    return EMPTY_ARRAY;
};

/**
 * Returns true if a special notification can be displayed when a participant
 * tries to unmute.
 *
 * @param {string} kind - The kind to check.
 * @param {Object} state - The global state.
 * @returns {boolean}
 */
export const shouldShowModeratedNotification = (kind: string, state: Object) =>
    isEnabledFromState(kind, state)
    && !isLocalParticipantApprovedFromState(kind, state);
