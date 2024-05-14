// @flow

import {
    isEnabledFromState,
    isLocalParticipantApprovedFromState,
    isParticipantApproved,
    isSupported
} from '../av-moderation/functions';
import { getCurrentConference } from '../base/conference/functions';
import { INVITE_ENABLED, PARTICIPANTS_ENABLED } from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';
import { MEDIA_TYPE, type MediaType } from '../base/media/constants';
import {
    getDominantSpeakerParticipant,
    getLocalParticipant,
    getRaiseHandsQueue,
    getRemoteParticipantsSorted,
    isLocalParticipantModerator,
    isParticipantModerator
} from '../base/participants/functions';
import { toState } from '../base/redux/functions';
import { normalizeAccents } from '../base/util/strings';
import { BREAKOUT_ROOMS_RENAME_FEATURE } from '../breakout-rooms/constants';
import { isInBreakoutRoom } from '../breakout-rooms/functions';

import { MEDIA_STATE, QUICK_ACTION_BUTTON, REDUCER_KEY } from './constants';

/**
 * Checks if a participant is force muted.
 *
 * @param {Object} participant - The participant.
 * @param {MediaType} mediaType - The media type.
 * @param {Object} state - The redux state.
 * @returns {MediaState}
 */
export function isForceMuted(participant: Object, mediaType: MediaType, state: Object) {
    if (isEnabledFromState(mediaType, state)) {
        if (participant?.local) {
            return !isLocalParticipantApprovedFromState(mediaType, state);
        }

        // moderators cannot be force muted
        if (isParticipantModerator(participant)) {
            return false;
        }

        return !isParticipantApproved(participant?.id ?? '', mediaType)(state);
    }

    return false;
}

/**
 * Determines the audio media state (the mic icon) for a participant.
 *
 * @param {Object} participant - The participant.
 * @param {boolean} muted - The mute state of the participant.
 * @param {Object} state - The redux state.
 * @returns {MediaState}
 */
export function getParticipantAudioMediaState(participant: Object, muted: Boolean, state: Object) {
    const dominantSpeaker = getDominantSpeakerParticipant(state);

    if (muted) {
        if (isForceMuted(participant, MEDIA_TYPE.AUDIO, state)) {
            return MEDIA_STATE.FORCE_MUTED;
        }

        return MEDIA_STATE.MUTED;
    }

    if (participant === dominantSpeaker) {
        return MEDIA_STATE.DOMINANT_SPEAKER;
    }

    return MEDIA_STATE.UNMUTED;
}

/**
 * Determines the video media state (the mic icon) for a participant.
 *
 * @param {Object} participant - The participant.
 * @param {boolean} muted - The mute state of the participant.
 * @param {Object} state - The redux state.
 * @returns {MediaState}
 */
export function getParticipantVideoMediaState(participant: Object, muted: Boolean, state: Object) {
    if (muted) {
        if (isForceMuted(participant, MEDIA_TYPE.VIDEO, state)) {
            return MEDIA_STATE.FORCE_MUTED;
        }

        return MEDIA_STATE.MUTED;
    }

    return MEDIA_STATE.UNMUTED;
}

/**
 * Returns this feature's root state.
 *
 * @param {IReduxState} state - Global state.
 * @returns {Object} Feature state.
 */
const getState = (state: Object) => state[REDUCER_KEY];

/**
 * Returns the participants pane config.
 *
 * @param {IStateful} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {Object}
 */
export const getParticipantsPaneConfig = (stateful: IStateful) => {
    const state = toState(stateful);
    const { participantsPane = {} } = state['features/base/config'];

    return participantsPane;
};

/**
 * Is the participants pane open.
 *
 * @param {Object} state - Global state.
 * @returns {boolean} Is the participants pane open.
 */
export const getParticipantsPaneOpen = (state: Object) => Boolean(getState(state)?.isOpen);

/**
 * Returns the type of quick action button to be displayed for a participant.
 * The button is displayed when hovering a participant from the participant list.
 *
 * @param {Object} participant - The participant.
 * @param {boolean} isAudioMuted - If audio is muted for the participant.
 * @param {boolean} isVideoMuted - If audio is muted for the participant.
 * @param {IReduxState} state - The redux state.
 * @returns {string} - The type of the quick action button.
 */
export function getQuickActionButtonType(
    participant: Object,
    isAudioMuted: Boolean,
    isVideoMuted: Boolean,
    state: Object) {
    // handled only by moderators
    const isVideoForceMuted = isForceMuted(participant, MEDIA_TYPE.VIDEO, state);

    if (isLocalParticipantModerator(state)) {
        if (!isAudioMuted) {
            return QUICK_ACTION_BUTTON.MUTE;
        }
        if (!isVideoMuted) {
            return QUICK_ACTION_BUTTON.STOP_VIDEO;
        }
        if (isVideoForceMuted) {
            return QUICK_ACTION_BUTTON.ALLOW_VIDEO;
        }
        if (isSupported()(state)) {
            return QUICK_ACTION_BUTTON.ASK_TO_UNMUTE;
        }
    }

    return QUICK_ACTION_BUTTON.NONE;
}

/**
 * Returns true if the invite button should be rendered.
 *
 * @param {Object} state - Global state.
 * @returns {boolean}
 */
export const shouldRenderInviteButton = (state: Object) => {
    const { disableInviteFunctions } = toState(state)['features/base/config'];
    const flagEnabled = getFeatureFlag(state, INVITE_ENABLED, true);
    const inBreakoutRoom = isInBreakoutRoom(state);

    return flagEnabled && !disableInviteFunctions && !inBreakoutRoom;
};

/**
 * Selector for retrieving ids of participants in the order that they are displayed in the filmstrip (with the
 * exception of participants with raised hand). The participants are reordered as follows.
 * 1. Dominant speaker.
 * 2. Local participant.
 * 3. Participants with raised hand.
 * 4. Participants with screenshare sorted alphabetically by their display name.
 * 5. Shared video participants.
 * 6. Recent speakers sorted alphabetically by their display name.
 * 7. Rest of the participants sorted alphabetically by their display name.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state features/base/participants.
 * @returns {Array<string>}
 */
export function getSortedParticipantIds(stateful: Object | Function): Array<string> {
    const id = getLocalParticipant(stateful)?.id;
    const remoteParticipants = getRemoteParticipantsSorted(stateful);
    const reorderedParticipants = new Set(remoteParticipants);
    const raisedHandParticipants = getRaiseHandsQueue(stateful).map(({ id: particId }) => particId);
    const remoteRaisedHandParticipants = new Set(raisedHandParticipants || []);
    const dominantSpeaker = getDominantSpeakerParticipant(stateful);

    for (const participant of remoteRaisedHandParticipants.keys()) {
        // Avoid duplicates.
        if (reorderedParticipants.has(participant)) {
            reorderedParticipants.delete(participant);
        }
    }

    const dominant = [];
    const dominantId = dominantSpeaker?.id;
    const local = remoteRaisedHandParticipants.has(id ?? '') ? [] : [ id ];

    // In case dominat speaker has raised hand, keep the order in the raised hand queue.
    // In case they don't have raised hand, goes first in the participants list.
    if (dominantId && dominantId !== id && !remoteRaisedHandParticipants.has(dominantId)) {
        reorderedParticipants.delete(dominantId);
        dominant.push(dominantId);
    }

    // Move self and participants with raised hand to the top of the list.
    return [
        ...dominant,
        ...local,
        ...Array.from(remoteRaisedHandParticipants.keys()),
        ...Array.from(reorderedParticipants.keys())
    ];
}

/**
 * Checks if a participant matches the search string.
 *
 * @param {Object} participant - The participant to be checked.
 * @param {string} searchString - The participants search string.
 * @returns {boolean}
 */
export function participantMatchesSearch(participant: Object, searchString: string) {
    if (searchString === '') {
        return true;
    }
    const participantName = normalizeAccents(participant?.name || participant?.displayName || '')
        .toLowerCase();
    const lowerCaseSearchString = searchString.trim().toLowerCase();

    return participantName.includes(lowerCaseSearchString);
}

/**
 * Returns whether the more actions button is visible.
 *
 * @param {IReduxState} state - Global state.
 * @returns {boolean}
 */
export const isMoreActionsVisible = (state) => {
    const isLocalModerator = isLocalParticipantModerator(state);
    const inBreakoutRoom = isInBreakoutRoom(state);
    const { hideMoreActionsButton } = getParticipantsPaneConfig(state);

    return inBreakoutRoom ? false : !hideMoreActionsButton && isLocalModerator;
};

/**
 * Returns whether the mute all button is visible.
 *
 * @param {IReduxState} state - Global state.
 * @returns {boolean}
 */
export const isMuteAllVisible = (state) => {
    const isLocalModerator = isLocalParticipantModerator(state);
    const inBreakoutRoom = isInBreakoutRoom(state);
    const { hideMuteAllButton } = getParticipantsPaneConfig(state);

    return inBreakoutRoom ? false : !hideMuteAllButton && isLocalModerator;
};

/**
 * Returns true if renaming the currently joined breakout room is allowed and false otherwise.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - True if reanming the currently joined breakout room is allowed and false otherwise.
 */
export function isCurrentRoomRenamable(state) {
    return isInBreakoutRoom(state) && isBreakoutRoomRenameAllowed(state);
}

/**
 * Returns true if renaming a breakout room is allowed and false otherwise.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - True if renaming a breakout room is allowed and false otherwise.
 */
export function isBreakoutRoomRenameAllowed(state) {
    const isLocalModerator = isLocalParticipantModerator(state);
    const conference = getCurrentConference(state);
    const isRenameBreakoutRoomsSupported
            = conference?.getBreakoutRooms()?.isFeatureSupported(BREAKOUT_ROOMS_RENAME_FEATURE) ?? false;

    return isLocalModerator && isRenameBreakoutRoomsSupported;
}

/**
 * Returns true if participants is enabled and false otherwise.
 *
 * @param {IStateful} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {boolean}
 */
export const isParticipantsPaneEnabled = (stateful) => {
    const state = toState(stateful);
    const { enabled = true } = getParticipantsPaneConfig(state);

    return Boolean(getFeatureFlag(state, PARTICIPANTS_ENABLED, true) && enabled);
};

/** 
 * Helper function that retrieves today's date and returns a string in the format YYYY-MM-DD 
 * Not relevant to a particular participant
 */
export function getTodaysDate(separator='-') {
    let newDate = new Date()
    let date = newDate.getDate();
    let month = newDate.getMonth() + 1;
    let year = newDate.getFullYear();

    return `${year}${separator}${month<10?`0${month}`:`${month}`}${separator}${date<10?`0${date}`:`${date}`}`
}

/**
 * Function that is used for deciding whether or not to display birthday cake icon in {ParticipantItem} component
 * as well as showing birthday hat menu option in {MeetingParticipantContextMenu}
 * @param {Object} participant - The participant object
 * @returns {boolean} true if participant's birthday is today, else returns false
 */
export const isTodayParticipantBirthday = (participant: Object) => (state: Object) => {
    const { enableBirthdayARHat } = state['features/base/config'];
    const { birthDate } = participant || {};
    if (!enableBirthdayARHat || !birthDate) {
        return false;
    }

    let participantMD = birthDate.substr(5, 5); // retrieve the substring of birthdate starting at index 5 for a length of 5 characters of the string
    const todayDate = getTodaysDate();
    let currentMD = todayDate.substr(5, 5); // retrieve the substring of birthdate starting at index 5 for a length of 5 characters of the string

    if (participantMD === currentMD) {
        return true;
    } else {
        return false;
    }
}
