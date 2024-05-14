// @flow

import _ from 'lodash';
import ReducerRegistry from '../base/redux/ReducerRegistry';
import { assign } from '../base/redux/functions';
import { mergeStats } from './functions';

import {
    ADD_TO_OFFSET,
    ADD_TO_OFFSET_LEFT,
    ADD_TO_OFFSET_RIGHT,
    INIT_REORDER_STATS,
    INIT_SEARCH,
    RESET_SEARCH_CRITERIA,
    SET_PANNING,
    SET_TIMELINE_BOUNDARY,
    SPEAKER_STATS_LOADED,
    SPEAKER_STATS_UPDATED,
    SPEAKER_STATS_ADDED,
    TOGGLE_FACE_EXPRESSIONS,
    UPDATE_SORTED_SPEAKER_STATS_IDS,
    UPDATE_STATS
} from './actionTypes';

/**
 * The initial state of the feature speaker-stats.
 *
 * @type {Object}
 */
const INITIAL_STATE = {
    stats: {},
    isOpen: false,
    pendingReorder: true,
    criteria: null,
    showFaceExpressions: false,
    sortedSpeakerStatsIds: [],
    timelineBoundary: null,
    offsetLeft: 0,
    offsetRight: 0,
    timelinePanning: {
        active: false,
        x: 0
    },
    data: [],
    items: []
};

ReducerRegistry.register('features/speaker-stats',
(state = INITIAL_STATE, action) => {
    switch (action.type) {
    case SPEAKER_STATS_LOADED:
        return _speakerStatsLoaded(state, action);

    case SPEAKER_STATS_ADDED:
        return _speakerStatsAdded(state, action);

    case SPEAKER_STATS_UPDATED:
        return _speakerStatsUpdated(state, action);
    case INIT_SEARCH:
        return _updateCriteria(state, action);
    case UPDATE_STATS:
        return _updateStats(state, action);
    case INIT_REORDER_STATS:
        return _initReorderStats(state);
    case UPDATE_SORTED_SPEAKER_STATS_IDS:
        return _updateSortedSpeakerStats(state, action);
    case RESET_SEARCH_CRITERIA:
        return _updateCriteria(state, { criteria: null });
    case TOGGLE_FACE_EXPRESSIONS: {
        return {
            ...state,
            showFaceExpressions: !state.showFaceExpressions
        };
    }
    case ADD_TO_OFFSET: {
        return {
            ...state,
            offsetLeft: state.offsetLeft + action.value,
            offsetRight: state.offsetRight + action.value
        };
    }
    case ADD_TO_OFFSET_RIGHT: {
        return {
            ...state,
            offsetRight: state.offsetRight + action.value
        };
    }
    case ADD_TO_OFFSET_LEFT: {
        return {
            ...state,
            offsetLeft: state.offsetLeft + action.value
        };
    }
    case SET_TIMELINE_BOUNDARY: {
        return {
            ...state,
            timelineBoundary: action.boundary
        };
    }
    case SET_PANNING: {
        return {
            ...state,
            timelinePanning: action.panning
        };
    }
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

    const found = _.findIndex(state.data, { nick: item.nick });
    if (found < 0) return state;

    const data = [
        ...state.data.slice(0, found),
        assign(state.data[found], item),
        ...state.data.slice(found+1)
    ];
    return makeStats(type, data);
}

/**
 * Reduces a specific Redux action INIT_SEARCH of the feature
 * speaker-stats.
 *
 * @param {Object} state - The Redux state of the feature speaker-stats.
 * @param {Action} action - The Redux action INIT_SEARCH to reduce.
 * @private
 * @returns {Object} The new state after the reduction of the specified action.
 */
function _updateCriteria(state, { criteria }: { criteria: string | null; }) {
    return _.assign(
        {},
        state,
        { criteria }
    );
}

/**
 * Reduces a specific Redux action UPDATE_STATS of the feature speaker-stats.
 *
 * @param {Object} state - The Redux state of the feature speaker-stats.
 * @param {Action} action - The Redux action UPDATE_STATS to reduce.
 * @private
 * @returns {Object} - The new state after the reduction of the specified action.
 */
function _updateStats(state, { stats }: { stats: any; }) {
    return {
        ...state,
        stats
    };
}

/**
 * Reduces a specific Redux action UPDATE_SORTED_SPEAKER_STATS_IDS of the feature speaker-stats.
 *
 * @param {Object} state - The Redux state of the feature speaker-stats.
 * @param {Action} action - The Redux action UPDATE_SORTED_SPEAKER_STATS_IDS to reduce.
 * @private
 * @returns {Object} The new state after the reduction of the specified action.
 */
function _updateSortedSpeakerStats(state, { participantIds }: { participantIds: Array<string>; }) {
    return {
        ...state,
        sortedSpeakerStatsIds: participantIds,
        pendingReorder: false
    };
}

/**
 * Reduces a specific Redux action INIT_REORDER_STATS of the feature
 * speaker-stats.
 *
 * @param {Object} state - The Redux state of the feature speaker-stats.
 * @private
 * @returns {Object} The new state after the reduction of the specified action.
 */
function _initReorderStats(state) {
    return _.assign(
        {},
        state,
        { pendingReorder: true }
    );
}
