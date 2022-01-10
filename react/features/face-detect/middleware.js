// @flow

import { batch } from 'react-redux';

import { CONNECTION_DISCONNECTED } from '../base/connection';
import {
    getParticipantPresenceStatus,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED
} from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import {
    closeAttentionAnalysis,
    stopFaceDetect,
    updateAttentionAnalysis
} from './actions';

import './subscriber';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONNECTION_DISCONNECTED:
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
    }

    return next(action);
});
