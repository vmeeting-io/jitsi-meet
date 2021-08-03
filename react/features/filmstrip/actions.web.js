// @flow

import { getLocalParticipant, getRemoteParticipants, pinParticipant } from '../base/participants';
import { toState } from '../base/redux';
import { getCurrentLayout, LAYOUTS } from '../video-layout';

import { SET_HORIZONTAL_VIEW_DIMENSIONS, SET_TILE_VIEW_DIMENSIONS } from './actionTypes';
import { calculateThumbnailSizeForHorizontalView, calculateThumbnailSizeForTileView } from './functions';

/**
 * The size of the side margins for the entire tile view area.
 */
const TILE_VIEW_SIDE_MARGINS = 20;

/**
 * Sets the dimensions of the tile view grid.
 *
 * @param {Object} dimensions - Whether the filmstrip is visible.
 * @param {Object} windowSize - The size of the window.
 * @param {Object | Function} stateful - An object or function that can be
 * resolved to Redux state using the {@code toState} function.
 * @returns {{
 *     type: SET_TILE_VIEW_DIMENSIONS,
 *     dimensions: Object
 * }}
 */
export function setTileViewDimensions(dimensions: Object, windowSize: Object, stateful: Object | Function) {
    const state = toState(stateful);
    const { clientWidth, clientHeight } = windowSize;
    const { disableResponsiveTiles } = state['features/base/config'];

    const thumbnailSize = calculateThumbnailSizeForTileView({
        ...dimensions,
        clientWidth,
        clientHeight,
        disableResponsiveTiles
    });
    const filmstripWidth = dimensions.columns * (TILE_VIEW_SIDE_MARGINS + thumbnailSize.width);

    return {
        type: SET_TILE_VIEW_DIMENSIONS,
        dimensions: {
            gridDimensions: dimensions,
            thumbnailSize,
            filmstripWidth
        }
    };
}

/**
 * Sets the dimensions of the thumbnails in horizontal view.
 *
 * @param {number} clientHeight - The height of the window.
 * @returns {{
 *     type: SET_HORIZONTAL_VIEW_DIMENSIONS,
 *     dimensions: Object
 * }}
 */
export function setHorizontalViewDimensions(clientHeight: number = 0) {
    return {
        type: SET_HORIZONTAL_VIEW_DIMENSIONS,
        dimensions: calculateThumbnailSizeForHorizontalView(clientHeight)
    };
}

/**
 * Emulates a click on the n-th video.
 *
 * @param {number} n - Number that identifies the video.
 * @returns {Function}
 */
export function clickOnVideo(n: number) {
    return (dispatch: Function, getState: Function) => {
        const state = getState();
        const participants = [ getLocalParticipant(state), ...getRemoteParticipants(state).values() ];
        const currentLayout = getCurrentLayout(getState());
        let nThParticipant;
        let index = 0;

        if (currentLayout !== LAYOUTS.TILE_VIEW) {
            index = 1;
            if (n === 0) {
                nThParticipant = getLocalParticipant(getState());
            }
        }

        for (let cursor = 0; !nThParticipant && cursor < participants.length; cursor += 1) {
            const p = participants[cursor];

            if (p.isFakeParticipant) continue;

            if (currentLayout !== LAYOUTS.TILE_VIEW && p.local) {
                continue;
            }

            if (n === index) {
                nThParticipant = p;
            }
            index += 1;
        }

        if (nThParticipant) {
            const { id, pinned } = nThParticipant;
            dispatch(pinParticipant(pinned ? null : id));
        } else {
            console.error('Not expected result:', n, participants);
        }
    };
}

export * from './actions.native';
