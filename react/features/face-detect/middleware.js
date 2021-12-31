// @flow

import { batch } from 'react-redux';

import { CONFERENCE_JOINED, CONFERENCE_LEFT } from '../base/conference';
import {
    getParticipantPresenceStatus,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED
} from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { PERMIT_DATA_REQUEST } from '../did-consent';
import { PREJOIN_INITIALIZED } from '../prejoin';
import {
    closeAttentionAnalysis,
    initFaceDetect,
    startFaceDetect,
    stopFaceDetect,
    updateAttentionAnalysis
} from './actions';

import './subscriber';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case PREJOIN_INITIALIZED: {
        const { face_detect } = store.getState()['features/base/conference'].roomInfo || {};
        if (face_detect) {
            store.dispatch(initFaceDetect());
        }
        break;
    }
    case CONFERENCE_JOINED: {
        const { face_detect } = store.getState()['features/base/conference'].roomInfo || {};
        if (face_detect) {
            store.dispatch(startFaceDetect());
        }
        break;
    }
    case CONFERENCE_LEFT:
        const { face_detect } = store.getState()['features/base/conference'].roomInfo || {};
        if (face_detect) {
            batch(() => {
                store.dispatch(closeAttentionAnalysis());
                store.dispatch(stopFaceDetect());
            });
        }
        break;
    case PARTICIPANT_UPDATED: {
        const { face_detect } = store.getState()['features/base/conference'].roomInfo || {};
        if (face_detect) {
            const { id, presence } = action.participant;
            const old = getParticipantPresenceStatus(store.getState(), id);
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
        const { face_detect } = store.getState()['features/base/conference'].roomInfo || {};
        if (face_detect) {
            const result = next(action);
            store.dispatch(updateAttentionAnalysis());
            return result;
        }
        break;
    }
    case PERMIT_DATA_REQUEST: {
        const { face_detect } = store.getState()['features/base/conference'].roomInfo || {};
        if (face_detect && !action.permit) {
            store.dispatch(stopFaceDetect());
        }
        break;
    }
    }

    return next(action);
});
