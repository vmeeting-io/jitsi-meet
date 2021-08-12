// @flow

import {
    SET_FILMSTRIP_ENABLED,
    SET_FILMSTRIP_VISIBLE,
    SET_TILE_VIEW_DIMENSIONS,
    SET_VISIBLE_REMOTE_PARTICIPANTS,
} from './actionTypes';

/**
 * Sets whether the filmstrip is enabled.
 *
 * @param {boolean} enabled - Whether the filmstrip is enabled.
 * @returns {{
 *     type: SET_FILMSTRIP_ENABLED,
 *     enabled: boolean
 * }}
 */
export function setFilmstripEnabled(enabled: boolean) {
    return {
        type: SET_FILMSTRIP_ENABLED,
        enabled
    };
}

/**
 * Sets whether the filmstrip is visible.
 *
 * @param {boolean} visible - Whether the filmstrip is visible.
 * @returns {{
 *     type: SET_FILMSTRIP_VISIBLE,
 *     visible: boolean
 * }}
 */
export function setFilmstripVisible(visible: boolean) {
    return {
        type: SET_FILMSTRIP_VISIBLE,
        visible
    };
}

/**
 * Sets the dimensions of the tile view grid. The action is only partially implemented on native as not all
 * of the values are currently used. Check the description of {@link SET_TILE_VIEW_DIMENSIONS} for the full set
 * of properties.
 *
 * @param {Object} dimensions - The tile view dimensions.
 * @param {Object} thumbnailSize - The size of an individual video thumbnail.
 * @param {number} thumbnailSize.height - The height of an individual video thumbnail.
 * @param {number} thumbnailSize.width - The width of an individual video thumbnail.
 * @returns {{
 *     type: SET_TILE_VIEW_DIMENSIONS,
 *     dimensions: Object
 * }}
 */
export function setTileViewDimensions({ thumbnailSize }: Object) {
    return {
        type: SET_TILE_VIEW_DIMENSIONS,
        dimensions: {
            thumbnailSize
        }
    };
}

/**
 * Sets the list of the visible participants in the filmstrip by storing the start and end index from the remote
 * participants array.
 *
 * @param {number} startIndex - The start index from the remote participants array.
 * @param {number} endIndex - The end index from the remote participants array.
 * @returns {{
 *      type: SET_VISIBLE_REMOTE_PARTICIPANTS,
 *      startIndex: number,
 *      endIndex: number,
 *      participants: Array<string>
 * }}
 */
export function setVisibleRemoteParticipants(startIndex: number, endIndex: number, participants: Array<string>) {
    // console.log('setVisibleRemoteparticipants:', startIndex, endIndex, participants);
    return {
        type: SET_VISIBLE_REMOTE_PARTICIPANTS,
        startIndex,
        endIndex,
        participants
    };
}
