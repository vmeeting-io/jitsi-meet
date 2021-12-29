/* eslint-disable no-unused-vars */
/* global config */

import { find } from 'lodash';

import { MiddlewareRegistry } from '../base/redux';
import {
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_KICKED,
    PARTICIPANT_UPDATED
} from '../base/participants/actionTypes';
import { speakerStatsAdded, speakerStatsUpdated } from './actions';

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case PARTICIPANT_JOINED: {
        _participantJoined(store, action);
        break;
    }

    case PARTICIPANT_UPDATED: {
        _participantUpdated(store, action);
        break;
    }

    case PARTICIPANT_LEFT:
    case PARTICIPANT_KICKED: {
        _participantLeft(store, action);
        break;
    }
    }

    return result;
});

function _participantJoined(store, action) {
    const { dispatch, getState } = store;
    const state = getState();
    const {
        email,
        id,
        local,
        name,
    } = action.participant;
    const { conference } = state['features/base/conference'];
    const participant = conference?.participants[id];

    if (!conference || !participant) return;

    // console.error('_participantJoined:', action);
    dispatch(speakerStatsAdded({
        nick: id,
        local: Boolean(local),
        name,
        email,
        joinTime: (new Date()).toJSON(),
        stats_id: local ? conference._statsCurrentId : participant?._statsID,
    }));
}

function _participantUpdated(store, { participant }) {
    const { dispatch, getState } = store;
    const state = getState();
    const found = find(
        state['features/speaker-stats'].items,
        { nick: participant.id }
    );

    if (!found || !participant?.name) {
        return;
    }

    if (participant.name !== found.name) {
        dispatch(speakerStatsUpdated({
            nick: participant.id,
            name: participant.name,
        }));
    }
}

function _participantLeft(store, { participant }) {
    const { dispatch } = store;

    dispatch(speakerStatsUpdated({
        nick: participant.id,
        leaveTime: (new Date()).toJSON(),
    }));
}
