// @flow

import { createVirtualAvatarEffect } from '../stream-effects/virtual-avatar/actions';

import { VIRTUAL_AVATAR_ENABLED, SET_VIRTUAL_AVATAR, VIRTUAL_AVATAR_TRACK_CHANGED } from './actionTypes';
import logger from './logger';

/**
 * Signals the local participant activate the virtual avatar video or not.
 *
 * @param {Object} options - Represents the virtual avatar setted options.
 * @param {Object} jitsiTrack - Represents the jitsi track that will have backgraund effect applied.
 * @returns {Promise}
 */
export function toggleVirtualAvatarEffect(options: Object, jitsiTrack: Object) {
    return async function(dispatch: Object => Object, getState: () => any) {
        await dispatch(virtualAvatarEnabled(options.enabled));
        await dispatch(setVirtualAvatar(options));
        const state = getState();
        const virtualAvatar = state['features/virtual-avatar'];

        if (jitsiTrack) {
            try {
                if (options.enabled) {
                    await jitsiTrack.setEffect(await createVirtualAvatarEffect(virtualAvatar, dispatch));
                } else {
                    await jitsiTrack.setEffect(undefined);
                    dispatch(virtualAvatarEnabled(false));
                }
            } catch (error) {
                dispatch(virtualAvatarEnabled(false));
                logger.error('Error on apply virtual avatar effect:', error);
            }
        }
    };
}

/**
 * Sets the selected virtual avatar image object.
 *
 * @param {Object} options - Represents the virtual avatar setted options.
 * @returns {{
 *     type: SET_VIRTUAL_AVATAR,
 *     type: string,
 * }}
 */
export function setVirtualAvatar(options: Object) {
    return {
        type: SET_VIRTUAL_AVATAR,
        virtualAvatarType: options?.virtualAvatarType,
        selectedVirtualAvatarUrl: options?.selectedVirtualAvatarUrl,
        selectedBackgroundUrl: options?.selectedBackgroundUrl,
        selectedBackgroundId: options?.selectedBackgroundId
    };
}

/**
 * Signals the local participant that the virtual avatar effect has been enabled.
 *
 * @param {boolean} virtualAvatarEffectEnabled - Indicate if virtual avatar effect is activated.
 * @returns {{
 *      type: VIRTUAL_AVATAR_ENABLED,
 *      virtualAvatarEffectEnabled: boolean
 * }}
 */
export function virtualAvatarEnabled(virtualAvatarEffectEnabled: boolean) {
    return {
        type: VIRTUAL_AVATAR_ENABLED,
        virtualAvatarEffectEnabled
    };
}

/**
 * Signals if the local track was changed due to a changes of the virtual avatar.
 *
 * @returns {{
 *    type: VIRTUAL_AVATAR_TRACK_CHANGED
 * }}
 */
export function virtualAvatarTrackChanged() {
    return {
        type: VIRTUAL_AVATAR_TRACK_CHANGED
    };
}
