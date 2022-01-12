// @flow

import { batch } from 'react-redux';

import { CONFERENCE_JOINED, STATUS_COMMAND } from '../base/conference';
import { CONNECTION_DISCONNECTED } from '../base/connection';
import {
    getLocalParticipant,
    getParticipantPresenceStatus,
    participantPresenceChanged,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED
} from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { MEDIA_TYPE, VIDEO_TYPE } from '../base/media';
import { isParticipantVideoMuted, TRACK_UPDATED } from '../base/tracks';
import { isPrejoinPageVisible } from '../prejoin';

import {
    closeAttentionAnalysis,
    stopFaceDetect,
    updateAttentionAnalysis
} from './actions';
import { STATUS } from './constants';
import { getFaceDetector, isAttentionAnalysisEnabled } from './functions';
import './subscriber';
import { isDIDPermitted } from '../did-consent';

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
        if (isAttentionAnalysisEnabled(store.getState())) {
            batch(() => {
                store.dispatch(closeAttentionAnalysis());
                store.dispatch(stopFaceDetect());
            });
        }
        break;
    }
    case PARTICIPANT_UPDATED: {
        const state = store.getState();
        if (isAttentionAnalysisEnabled(state)) {
            const { id, presence } = action.participant;
            const old = getParticipantPresenceStatus(state, id);
            const result = next(action);
            if (presence && old !== presence) {
                store.dispatch(updateAttentionAnalysis());
            }
            return result;
        }
        break;
    }
    case PARTICIPANT_JOINED:
    case PARTICIPANT_LEFT: {
        if (isAttentionAnalysisEnabled(store.getState())) {
            const result = next(action);
            store.dispatch(updateAttentionAnalysis());
            return result;
        }
        break;
    }
    case TRACK_UPDATED: {
        const state = store.getState();
        if (isAttentionAnalysisEnabled(state)) {
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
        }
        break;
    }
    }

    return next(action);
});
