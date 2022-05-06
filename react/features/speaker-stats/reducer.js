// @flow

import { findIndex } from 'lodash';
import { ReducerRegistry, assign } from '../base/redux';
import { mergeStats } from './functions';

import {
    SPEAKER_STATS_LOADED,
    SPEAKER_STATS_UPDATED,
    SPEAKER_STATS_ADDED,
} from './actionTypes';

/**
 * Listen for actions that contain the conference object, so that it can be
 * stored for use by other action creators.
 */
ReducerRegistry.register(
    'features/speaker-stats',
    (state = { data: [], items: [] }, action) => {
        switch (action.type) {
        case SPEAKER_STATS_LOADED:
            return _speakerStatsLoaded(state, action);

        case SPEAKER_STATS_ADDED:
            return _speakerStatsAdded(state, action);

        case SPEAKER_STATS_UPDATED:
            return _speakerStatsUpdated(state, action);
        }

        return state;
    });

function makeStats(type, data) {
    const items = mergeStats(data);

    // console.error('makeStats:', type, data, items);
    return { data, items };
}

function _speakerStatsLoaded(state, { type, data }) {
    return makeStats(type, data.filter(log => !log.jid.startsWith('recorder@recorder')));
}

function _speakerStatsAdded(state, { type, item }) {
    if (!item?.nick) return state;

    const data = [...state.data, item];
    return makeStats(type, data);
}

function _speakerStatsUpdated(state, { type, item }) {
    if (!item?.nick) return state;

    const found = findIndex(state.data, { nick: item.nick });
    if (found < 0) return state;

    const data = [
        ...state.data.slice(0, found),
        assign(state.data[found], item),
        ...state.data.slice(found+1)
    ];
    return makeStats(type, data);
}
