// @flow
import md5 from 'js-md5';

import { getCurrentConference } from '../base/conference/functions';
import { toState } from '../base/redux';
import {
    getLocalParticipant,
    getParticipantCount,
    getPinnedParticipant,
    getRemoteParticipants,
    isLocalParticipantModerator
} from '../base/participants/functions';
import { encodeToBase64URL } from '../base/util/httpUtils';
import { appendURLHashParam, appendURLParam } from '../base/util/uri';
import { getCurrentRoomId, isInBreakoutRoom } from '../breakout-rooms/functions';
import { isForceMuted } from '../participants-pane/functions';

import { MIN_USER_LIMIT, USER_LIMIT_THRESHOLD, WHITEBOARD_ID, WHITEBOARD_PATH_NAME } from './constants';

const getWhiteboardState = (state: Object) => state['features/whiteboard'];

export const getWhiteboardConfig = (state: Object) =>
    state['features/base/config'].whiteboard || {};

const getWhiteboardUserLimit = (state) => {
    const userLimit = getWhiteboardConfig(state).userLimit || Infinity;

    return userLimit === Infinity
        ? userLimit
        : Math.max(Number(getWhiteboardConfig(state).userLimit || 1), MIN_USER_LIMIT);
};

/**
 * Returns the whiteboard collaboration details.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {{ roomId: string, roomKey: string}|undefined}
 */
export const getCollabDetails = (state) => getWhiteboardState(state).collabDetails;

/**
 * Indicates whether the whiteboard collaboration details are available.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
const hasCollabDetails = (state) => Boolean(
    getCollabDetails(state)?.roomId && getCollabDetails(state)?.roomKey
);

/**
 * Indicates whether the whiteboard is enabled.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export const isWhiteboardEnabled = (state) => {
//     (getWhiteboardConfig(state).enabled || hasCollabDetails(state))
//     && getWhiteboardConfig(state).collabServerBaseUrl
//     && getCurrentConference(state)?.getMetadataHandler()
// ?.isSupported();
    const { roomInfo } = state['features/base/conference'];
    return Boolean(roomInfo?.whiteboard?.use_yn);
}

/**
 * Indicates whether the whiteboard is open.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export const isWhiteboardOpen = (state) => getWhiteboardState(state).editing;
// export const isWhiteboardOpen = (state) => getWhiteboardState(state).isOpen;

/**
 * Indicates whether the whiteboard button is visible.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export const isWhiteboardButtonVisible = (state: Object): boolean =>
    isWhiteboardEnabled(state) && (isLocalParticipantModerator(state) || isWhiteboardOpen(state));

/**
 * Indicates whether the whiteboard is present as a meeting participant.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export const isWhiteboardPresent = (state) => getRemoteParticipants(state).has(WHITEBOARD_ID);

/**
 * Returns the whiteboard collaboration server url.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {string}
 */
export const getCollabServerUrl = (state) => {
    const collabServerBaseUrl = getWhiteboardConfig(state).collabServerBaseUrl;

    if (!collabServerBaseUrl) {
        return;
    }

    const { locationURL } = state['features/base/connection'];
    const inBreakoutRoom = isInBreakoutRoom(state);
    const roomId = getCurrentRoomId(state);
    const room = md5.hex(`${locationURL?.origin}${locationURL?.pathname}${inBreakoutRoom ? `|${roomId}` : ''}`);

    return appendURLParam(collabServerBaseUrl, 'room', room);
};

/**
 * Whether the whiteboard is visible on stage.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export const isWhiteboardVisible = (state: Object): boolean => {
    return isWhiteboardOpen(state);
    // TODO: 화이트보드가 참석자로 표시되면 아래 코드가 수행되어야 함.
    // return (
    //     getPinnedParticipant(state)?.id === WHITEBOARD_ID
    //     || state['features/large-video'].participantId === WHITEBOARD_ID
    // );
}

/**
 * Indicates whether the whiteboard is accessible to a participant that has a moderator role.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export const isWhiteboardAllowed = (state: Object): boolean => {
    const local = getLocalParticipant(state);
    const approvedWhiteboard = !isForceMuted(local, 'whiteboard', state);

    return isWhiteboardEnabled(state) && (
        isLocalParticipantModerator(state) || approvedWhiteboard);
}

/**
 * Whether to enforce the whiteboard user limit.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export const shouldEnforceUserLimit = (state) => {
    const userLimit = getWhiteboardUserLimit(state);

    if (userLimit === Infinity) {
        return false;
    }

    const participantCount = getParticipantCount(state);

    return participantCount > userLimit;
};

/**
 * Whether to show a warning about the whiteboard user limit.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export const shouldNotifyUserLimit = (state) => {
    const userLimit = getWhiteboardUserLimit(state);

    if (userLimit === Infinity) {
        return false;
    }

    const participantCount = getParticipantCount(state);

    return participantCount + USER_LIMIT_THRESHOLD > userLimit;
};

/**
 * Generates the URL for the static whiteboard page.
 *
 * @param {string} locationUrl - The window location href.
 * @param {string} collabServerUrl - The whiteboard collaboration server url.
 * @param {Object} collabDetails - The whiteboard collaboration details.
 * @param {string} localParticipantName - The local participant name.
 * @returns {string}
 */
export function getWhiteboardInfoForURIString(
        locationUrl,
        collabServerUrl,
        collabDetails,
        localParticipantName
) {
    if (!collabServerUrl || !locationUrl) {
        return undefined;
    }

    let state = {};
    let url = `${locationUrl.substring(0, locationUrl.lastIndexOf('/'))}/${WHITEBOARD_PATH_NAME}`;

    if (collabDetails?.roomId) {
        state = {
            ...state,
            roomId: collabDetails.roomId
        };
    }

    if (collabDetails?.roomKey) {
        state = {
            ...state,
            roomKey: collabDetails.roomKey
        };
    }

    state = {
        ...state,
        collabServerUrl,
        localParticipantName
    };

    url = appendURLHashParam(url, 'state', encodeToBase64URL(JSON.stringify(state)));

    return url;
}

/**
 * Retrieves the current whiteboard URL.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState} function.
 * @returns {?string} - Current whiteboard URL or undefined.
 */
export function getWhiteboardUrl(stateful: Function | Object) {
    const state = toState(stateful);
    const { url } = state['features/whiteboard'];
    const { displayName } = state['features/base/settings'];
    const { roomInfo } = state['features/base/conference'];
    const local = getLocalParticipant(state);
    const approved = !isForceMuted(local, 'whiteboard', state);

    if (!url) {
        return undefined;
    }

    const WHITEBOARD_OPTIONS = {
        role: approved ? 'owner' : 'participant',
    };

    const params = new URLSearchParams(WHITEBOARD_OPTIONS);

    if (local?.name || displayName) {
        // console.log('===>getWhiteboardUrl:', local?.name, displayName);
        params.append('userName', displayName || local?.name);
    }

    if (Boolean(roomInfo.whiteboard?.userVisible)) {
        params.append('userVisible', roomInfo.whiteboard?.userVisible);
    }

    return `${url}?${params.toString()}`;
}