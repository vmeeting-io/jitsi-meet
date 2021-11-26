// @flow

import { CONFERENCE_LEFT } from '../base/conference';
import { CONNECTION_ESTABLISHED } from '../base/connection';
import {
    getParticipantPresenceStatus,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED
} from '../base/participants';
import { batch, MiddlewareRegistry } from '../base/redux';
import { PREJOIN_INITIALIZED, PREJOIN_START_CONFERENCE } from '../prejoin';

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
        store.dispatch(initFaceDetect());
        break;
    }
    case PREJOIN_START_CONFERENCE: {
        store.dispatch(startFaceDetect());
        break;
    }
    case CONFERENCE_LEFT:
        batch(() => {
            store.dispatch(closeAttentionAnalysis());
            store.dispatch(stopFaceDetect());
        });
        break;
    case PARTICIPANT_UPDATED: {
        const { id, presence } = action.participant;
        const old = getParticipantPresenceStatus(store.getState(), id);
        const result = next(action);
        if (presence && old !== presence) {
            store.dispatch(updateAttentionAnalysis());
        }
        return result;
    }
    case PARTICIPANT_JOINED:
    case PARTICIPANT_LEFT: {
        const result = next(action);
        store.dispatch(updateAttentionAnalysis());
        return result;
    }
    }

    return next(action);
});
