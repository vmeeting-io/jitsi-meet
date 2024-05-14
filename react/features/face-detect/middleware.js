// @flow

import { isEmpty } from 'lodash';
import { batch } from 'react-redux';

import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { STATUS_COMMAND } from '../base/conference/constants';
import { CONNECTION_DISCONNECTED } from '../base/connection/actionTypes';
import { participantPresenceChanged } from '../base/participants/actions';
import { PARTICIPANT_JOINED, PARTICIPANT_LEFT, PARTICIPANT_UPDATED } from '../base/participants/actionTypes';
import {
    getLocalParticipant,
    getParticipantById,
    getParticipantPresenceStatus,
    isLocalParticipantModerator,
} from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { MEDIA_TYPE, VIDEO_TYPE } from '../base/media/constants';
import { TRACK_UPDATED } from '../base/tracks/actionTypes';
import { isParticipantVideoMuted } from '../base/tracks/functions';
import { isDIDPermitted } from '../did-consent/functions';
import { UPDATE_BREAKOUT_ROOMS } from '../breakout-rooms/actionTypes';
import { getBreakoutRooms } from '../breakout-rooms/functions';
import { isPrejoinPageVisible } from '../prejoin/functions';

import {
    closeAttentionAnalysis,
    stopFaceDetect,
    updateAttentionAnalysis,
    updateAttentionStatus
} from './actions';
import { SET_STATUS_MAP, UPDATE_ATTENTION_STATUS } from './actionTypes';
import { STATUS } from './constants';
import { getFaceDetector, getStatusMap, isAttentionAnalysisEnabled } from './functions';
import './subscriber';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED: {
        const state = store.getState();
        if (isAttentionAnalysisEnabled(state) && isDIDPermitted(state)) {
            const localParticipant = getLocalParticipant(state);
            if (isParticipantVideoMuted(localParticipant, state)) {
                action.conference.sendCommand(STATUS_COMMAND, { value: STATUS.ABSENT });
                store.dispatch(participantPresenceChanged(localParticipant.id, STATUS.ABSENT));
            }
        }
        break;
    }
    case CONNECTION_DISCONNECTED: {
        const state = store.getState();
        if (isAttentionAnalysisEnabled(state)) {
            batch(() => {
                store.dispatch(closeAttentionAnalysis());
                store.dispatch(stopFaceDetect());
            });
        }
        break;
    }
    case PARTICIPANT_UPDATED: {
        const state = store.getState();
        if (isAttentionAnalysisEnabled(state) && isLocalParticipantModerator(state)) {
            const { id, presence, name } = action.participant;
            const old = getParticipantById(state, id);
            const { rooms } = getBreakoutRooms(state);
            const result = next(action);
            if (presence && old.presence !== presence) {
                store.dispatch(updateAttentionStatus({ id, status: presence }));
            } else if (name && old.name !== name && isEmpty(rooms)) {
                store.dispatch(updateAttentionAnalysis());
            }
            return result;
        }
        break;
    }
    case PARTICIPANT_JOINED:
    case PARTICIPANT_LEFT: {
        const state = store.getState();
        const rooms = getBreakoutRooms(state);
        if (isAttentionAnalysisEnabled(state)
            && isLocalParticipantModerator(state)
            && isEmpty(rooms)) {
            const statusMap = getStatusMap(state);
            if (action.type === PARTICIPANT_JOINED) {
                statusMap.set(action.participant.id, action.participant.presence);
            } else {
                statusMap.delete(action.participant.id);
            }
            store.dispatch({ type: SET_STATUS_MAP, statusMap });

            const result = next(action);
            store.dispatch(updateAttentionAnalysis());
            return result;
        }
        break;
    }
    case TRACK_UPDATED: {
        const state = store.getState();
        if (isAttentionAnalysisEnabled(state) && isDIDPermitted(state)) {
            const result = next(action);

            if (isPrejoinPageVisible(state)) {
                return result;
            }

            const { jitsiTrack } = action.track;
            const muted = jitsiTrack.isMuted();
            const isVideoTrack = jitsiTrack.type !== MEDIA_TYPE.AUDIO;
            if (isVideoTrack && jitsiTrack.isLocal()) {
                const instance = getFaceDetector(state);
                if (instance?.isRunning() && jitsiTrack.videoType === VIDEO_TYPE.DESKTOP) {
                    instance.pause();
                    instance.sendPresence(STATUS.CONCENTRATED);
                } else if (jitsiTrack.videoType === VIDEO_TYPE.CAMERA) {
                    if (instance?.isRunning() && muted) {
                        instance.pause();
                        instance.sendPresence(STATUS.ABSENT);
                    } else if (instance?.isPaused() && !muted) {
                        instance.resume();
                        instance.sendPresence();
                    }
                }
            }
            return result;
        }
        break;
    }
    case UPDATE_BREAKOUT_ROOMS: {
        const state = store.getState();
        if (isAttentionAnalysisEnabled(state) && isLocalParticipantModerator(state)) {
            const result = next(action);
            store.dispatch(updateAttentionAnalysis());
            return result;
        }
        break;
    }
    case UPDATE_ATTENTION_STATUS: {
        const state = store.getState();
        if (isAttentionAnalysisEnabled(state) && isLocalParticipantModerator(state)) {
            store.dispatch(updateAttentionStatus(action));
        }
        break;
    }
    }

    return next(action);
});
