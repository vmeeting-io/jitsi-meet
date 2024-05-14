// @flow

import _ from 'lodash';

import { getCurrentConference } from '../base/conference/functions';
import {
    getLocalParticipant,
    getParticipantById,
    getParticipantCount,
    isLocalParticipantModerator
} from '../base/participants/functions';
import { toState } from '../base/redux/functions';

import { FEATURE_KEY } from './constants';

/**
 * Returns the rooms object for breakout rooms.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {Object} Object of rooms.
 */
export const getBreakoutRooms = (stateful: Function | Object) => toState(stateful)[FEATURE_KEY].rooms;

/**
 * Returns the main room.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {Object|undefined} The main room object, or undefined.
 */
export const getMainRoom = (stateful: Function | Object) => {
    const rooms = getBreakoutRooms(stateful);

    return _.find(rooms, room => Boolean(room?.isMainRoom));
};

/**
 * Returns the rooms info.
 *
 * @param {IStateful} stateful - The redux store, the redux.

* @returns {IRoomsInfo} The rooms info.
 */
export const getRoomsInfo = (stateful: Function | Object) => {
    const breakoutRooms = getBreakoutRooms(stateful);
    const conference = getCurrentConference(stateful);

    const initialRoomsInfo = {
        rooms: []
    };

    // only main roomn
    if (!breakoutRooms || Object.keys(breakoutRooms).length === 0) {
        // filter out hidden participants
        const conferenceParticipants = conference?.getParticipants()
            .filter((participant) => !participant.isHidden());

        const localParticipant = getLocalParticipant(stateful);
        let localParticipantInfo;

        if (localParticipant) {
            localParticipantInfo = {
                role: localParticipant.role,
                displayName: localParticipant.name,
                avatarUrl: localParticipant.loadableAvatarUrl,
                id: localParticipant.id
            };
        }

        return {
            ...initialRoomsInfo,
            rooms: [ {
                isMainRoom: true,
                id: conference?.room?.roomjid,
                jid: conference?.room?.myroomjid,
                participants: conferenceParticipants?.length > 0
                    ? [
                        localParticipantInfo,
                        ...conferenceParticipants.map((participantItem) => {
                            const storeParticipant = getParticipantById(stateful, participantItem.getId());

                            return {
                                jid: participantItem.getJid(),
                                role: participantItem.getRole(),
                                displayName: participantItem.getDisplayName(),
                                avatarUrl: storeParticipant?.loadableAvatarUrl,
                                id: participantItem.getId()
                            };
                        }) ]
                    : [ localParticipantInfo ]
            } ]
        };
    }

    return {
        ...initialRoomsInfo,
        rooms: Object.keys(breakoutRooms).map(breakoutRoomKey => {
            const breakoutRoomItem = breakoutRooms[breakoutRoomKey];

            return {
                isMainRoom: Boolean(breakoutRoomItem.isMainRoom),
                id: breakoutRoomItem.id,
                jid: breakoutRoomItem.jid,
                participants: breakoutRoomItem.participants && Object.keys(breakoutRoomItem.participants).length
                    ? Object.keys(breakoutRoomItem.participants).map(participantLongId => {
                        const participantItem = breakoutRoomItem.participants[participantLongId];
                        const ids = participantLongId.split('/');
                        const storeParticipant = getParticipantById(stateful,
                            ids.length > 1 ? ids[1] : participantItem.jid);

                        return {
                            jid: participantItem?.jid,
                            role: participantItem?.role,
                            displayName: participantItem?.displayName,
                            avatarUrl: storeParticipant?.loadableAvatarUrl,
                            id: storeParticipant ? storeParticipant.id
                                : participantLongId
                        };
                    }) : []
            };
        })
    };
};

/**
 * Returns the room by Jid.
 *
 * @param {IStateful} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @param {string} roomJid - The jid of the room.
 * @returns {IRoom|undefined} The main room object, or undefined.
 */
export const getRoomByJid = (stateful: IStateful, roomJid: string) => {
    const rooms = getBreakoutRooms(stateful);

    return _.find(rooms, room => room?.jid === roomJid);
};

/**
 * Returns the id of the current room.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {string} Room id or undefined.
 */
export const getCurrentRoomId = (stateful: Function | Object) => {
    const conference = getCurrentConference(stateful);

    // $FlowExpectedError
    return conference?.getName();
};

/**
 * Determines whether the local participant is in a breakout room.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {boolean}
 */
export const isInBreakoutRoom = (stateful: Function | Object) => {
    const conference = getCurrentConference(stateful);

    // $FlowExpectedError
    return conference?.getBreakoutRooms()?.isBreakoutRoom();
};

/**
 * Returns the breakout rooms config.
 *
 * @param {IStateful} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {Object}
 */
export const getBreakoutRoomsConfig = (stateful: Function | Object) => {
    const state = toState(stateful);
    const { breakoutRooms = {} } = state['features/base/config'];

    return breakoutRooms;
};

/**
 * Returns whether the add breakout room button is visible.
 *
 * @param {IStateful} stateful - Global state.
 * @returns {boolean}
 */
export const isAddBreakoutRoomButtonVisible = (stateful: Function | Object) => {
    const state = toState(stateful);
    const isLocalModerator = isLocalParticipantModerator(state);
    const { conference } = state['features/base/conference'];
    const isBreakoutRoomsSupported = conference?.getBreakoutRooms()?.isSupported();
    const { hideAddRoomButton } = getBreakoutRoomsConfig(state);

    return isLocalModerator && isBreakoutRoomsSupported && !hideAddRoomButton;
};

/**
 * Returns whether the auto assign participants to breakout rooms button is visible.
 *
 * @param {IStateful} stateful - Global state.
 * @returns {boolean}
 */
export const isAutoAssignParticipantsVisible = (stateful: Function | Object) => {
    const state = toState(stateful);
    const rooms = getBreakoutRooms(state);
    const inBreakoutRoom = isInBreakoutRoom(state);
    const isLocalModerator = isLocalParticipantModerator(state);
    const participantsCount = getParticipantCount(state);
    const { hideAutoAssignButton } = getBreakoutRoomsConfig(state);

    return !inBreakoutRoom
        && isLocalModerator
        && participantsCount > 2
        && Object.keys(rooms).length > 1
        && !hideAutoAssignButton;
};

/**
 * Returns the rooms object for breakout rooms.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {Object} Object of rooms.
 */
export const getSortedBreakoutRooms = (stateful: Function | Object) => {
    const rooms = getBreakoutRooms(stateful);

    return _.sortBy(rooms, 'name');
}

export const getParticipantCountInBreakoutRooms = state => {
    const rooms = getBreakoutRooms(state);

    return _.size(rooms) === 0
        ? getParticipantCount(state)
        : _.reduce(rooms, (sum, room) => sum + _.size(room.participants), 0);
}

export const isBreakoutRoomsAllowed = state => {
    const { roomInfo } = state['features/base/conference'];
    
    return isAddBreakoutRoomButtonVisible(state) && Boolean(roomInfo?.use_breakout_rooms);
}
