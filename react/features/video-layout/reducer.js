// @flow

import { ReducerRegistry } from '../base/redux';

import {
    SCREEN_SHARE_REMOTE_PARTICIPANTS_UPDATED,
    SET_PAGINATION,
    SET_TILE_VIEW,
} from './actionTypes';

const DEFAULT_STATE = {
    remoteScreenShares: [],

    /**
     * The indicator which determines whether the video layout should display
     * video thumbnails in a tiled layout.
     *
     * Note: undefined means that the user hasn't requested anything in particular yet, so
     * we use our auto switching rules.
     *
     * @public
     * @type {boolean}
     */
    tileViewEnabled: undefined,

    pagination: {
        // order: ['video.muted', 'name'],
        current: 1,
        pageSize: 1,
        totalPages: 1
    }
};

const STORE_NAME = 'features/video-layout';

ReducerRegistry.register(STORE_NAME, (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case SCREEN_SHARE_REMOTE_PARTICIPANTS_UPDATED: {
        return {
            ...state,
            remoteScreenShares: action.participantIds
        };
    }

    case SET_TILE_VIEW:
        return {
            ...state,
            tileViewEnabled: action.enabled
        };

    case SET_PAGINATION: {
        return {
            ...state,
            pagination: action.pagination
        };
    }
    }

    return state;
});
