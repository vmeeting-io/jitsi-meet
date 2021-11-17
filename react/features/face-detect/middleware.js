// @flow

import { updateAttentionAnalysis } from '.';
import { CONNECTION_ESTABLISHED } from '../base/connection';
import {
    getParticipantPresenceStatus,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED
} from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { startFaceDetect } from './actions';

import './subscriber';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONNECTION_ESTABLISHED: {
        const result = next(action);
        store.dispatch(startFaceDetect());
        return result;
    }
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
