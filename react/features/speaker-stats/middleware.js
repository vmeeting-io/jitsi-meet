/* eslint-disable no-unused-vars */
/* global config */

import { find } from 'lodash';
import { batch } from 'react-redux';

import {
    PARTICIPANT_JOINED,
    PARTICIPANT_KICKED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED
} from '../base/participants/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import {
    ADD_TO_OFFSET,
    INIT_SEARCH,
    INIT_UPDATE_STATS,
    RESET_SEARCH_CRITERIA
} from './actionTypes';
import {
    clearTimelineBoundary,
    initReorderStats,
    setTimelineBoundary,
    speakerStatsAdded,
    speakerStatsUpdated,
    updateSortedSpeakerStatsIds,
    updateStats
} from './actions.any';
import { CLEAR_TIME_BOUNDARY_THRESHOLD } from './constants';
import {
    filterBySearchCriteria,
    getCurrentDuration,
    getPendingReorder,
    getSortedSpeakerStatsIds,
    getTimelineBoundaries,
    resetHiddenStats
} from './functions';

MiddlewareRegistry.register(store => next => action => {
    const { dispatch, getState } = store;

    switch (action.type) {
    case INIT_SEARCH: {
        const state = getState();
        const stats = filterBySearchCriteria(state);

        dispatch(updateStats(stats));
        break;
    }

    case INIT_UPDATE_STATS:
        if (action.getSpeakerStats) {
            const state = getState();
            const speakerStats = { ...action.getSpeakerStats() };
            const stats = filterBySearchCriteria(state, speakerStats);
            const pendingReorder = getPendingReorder(state);

            batch(() => {
                if (pendingReorder) {
                    dispatch(updateSortedSpeakerStatsIds(getSortedSpeakerStatsIds(state, stats) ?? []));
                }

                dispatch(updateStats(stats));
            });

        }

        break;

    case RESET_SEARCH_CRITERIA: {
        const state = getState();
        const stats = resetHiddenStats(state);

        dispatch(updateStats(stats));
        break;
    }
    case PARTICIPANT_JOINED:
    case PARTICIPANT_LEFT:
    case PARTICIPANT_KICKED:
    case PARTICIPANT_UPDATED: {
        const { pendingReorder } = getState()['features/speaker-stats'];

        if (!pendingReorder) {
            dispatch(initReorderStats());
        }

        if (action.type === PARTICIPANT_JOINED) {
            _participantJoined(store, action);
        }

        if (action.type === PARTICIPANT_UPDATED) {
            _participantUpdated(store, action);
        }
        break;
    }

    case PARTICIPANT_LEFT:
    case PARTICIPANT_KICKED: {
        _participantLeft(store, action);
        break;
    }

    case ADD_TO_OFFSET: {
        const state = getState();
        const { timelineBoundary } = state['features/speaker-stats'];
        const { right } = getTimelineBoundaries(state);
        const currentDuration = getCurrentDuration(state) ?? 0;

        if (Math.abs((right + action.value) - currentDuration) < CLEAR_TIME_BOUNDARY_THRESHOLD) {
            dispatch(clearTimelineBoundary());
        } else if (!timelineBoundary) {
            dispatch(setTimelineBoundary(currentDuration ?? 0));
        }

        break;
    }
    }

    return next(action);
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
