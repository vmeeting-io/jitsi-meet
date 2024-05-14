// @flow

import { jitsiLocalStorage } from '@jitsi/js-utils';
import { find } from 'lodash';

import { conferenceSubjectChanged } from '../base/conference/actions';
import { CONNECTION_DISCONNECTED } from '../base/connection/actionTypes';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { getParticipantById } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { editMessage } from '../chat/actions.any';
import { MESSAGE_TYPE_REMOTE } from '../chat/constants';
import { UPDATE_ATTENTION_STATUS } from '../face-detect/actionTypes';

import { UPDATE_BREAKOUT_ROOMS } from './actionTypes';
import { moveToRoom } from './actions';
import { getBreakoutRooms } from './functions';
import logger from './logger';

/**
 * Registers a change handler for state['features/base/conference'].conference to
 * set the event listeners needed for the breakout rooms feature to operate.
 */
StateListenerRegistry.register(
    state => state['features/base/conference'].conference,
    (conference, { dispatch, getState }, previousConference) => {
        if (conference && !previousConference) {
            conference.on(JitsiConferenceEvents.BREAKOUT_ROOMS_MOVE_TO_ROOM, roomId => {
                logger.debug(`Moving to room: ${roomId}`);
                dispatch(moveToRoom(roomId));
            });

            conference.on(JitsiConferenceEvents.BREAKOUT_ROOMS_UPDATED, ({ rooms, roomCounter }) => {
                logger.debug('Room list updated');
                if (typeof APP !== 'undefined') {
                    APP.API.notifyBreakoutRoomsUpdated(rooms);
                }
                dispatch({
                    type: UPDATE_BREAKOUT_ROOMS,
                    rooms,
                    roomCounter
                });

                // if current subject of conference is changed, notify it.
                const currentSubject = getState()['features/base/conference'].subject;
                const found = find(rooms, room => room.jid === conference?.room?.roomjid);
                if (found?.name && found.name !== currentSubject) {
                    dispatch(conferenceSubjectChanged(found.name));
                }
            });

            conference.on(JitsiConferenceEvents.BREAKOUT_ROOMS_ATTENTION_UPDATED, ({ id, status }) => {
                logger.debug('Attention is updated:', id, status);
                dispatch({ type: UPDATE_ATTENTION_STATUS, id, status });
            });
        }
    });

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const { type } = action;
    const result = next(action);

    switch (type) {
    case UPDATE_BREAKOUT_ROOMS: {
        // edit name if it was overwritten
        if (!action.updatedNames) {
            const { overwrittenNameList } = getState()['features/base/participants'];

            if (Object.keys(overwrittenNameList).length > 0) {
                const newRooms = {};

                Object.entries(action.rooms).forEach(([ key, r ]) => {
                    let participants = r?.participants || {};
                    let jid;

                    for (const id of Object.keys(overwrittenNameList)) {
                        jid = Object.keys(participants).find(p => p.slice(p.indexOf('/') + 1) === id);

                        if (jid) {
                            participants = {
                                ...participants,
                                [jid]: {
                                    ...participants[jid],
                                    displayName: overwrittenNameList[id]
                                }
                            };
                        }
                    }

                    newRooms[key] = {
                        ...r,
                        participants
                    };
                });

                action.rooms = newRooms;
            }
        }

        // edit the chat history to match names for participants in breakout rooms
        const { messages } = getState()['features/chat'];

        messages?.forEach(m => {
            if (m.messageType === MESSAGE_TYPE_REMOTE && !getParticipantById(getState(), m.id)) {
                const rooms = action.room;

                for (const room of Object.values(rooms)) {
                    // $FlowExpectedError
                    const participants = room.participants || {};
                    const matchedJid = Object.keys(participants).find(jid => jid.endsWith(m.id));

                    if (matchedJid) {
                        m.displayName = participants[matchedJid].displayName;

                        dispatch(editMessage(m));
                    }
                }
            }
        });

        break;
    }
    case CONNECTION_DISCONNECTED:
        jitsiLocalStorage.removeItem('xmpp_conference_password_override');
        break;
    }

    return result;
});
