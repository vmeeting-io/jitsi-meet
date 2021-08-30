// @flow
import { createAREffect } from '../stream-effects/ar-effect';

import { AR_ENABLED, SET_AR } from './actionTypes';
import logger from './logger';

/**
 * Signals the local participant activate the virtual background video or not.
 *
 * @param {Object} options - Represents the virtual background setted options.
 * @param {Object} jitsiTrack - Represents the jitsi track that will have backgraund effect applied.
 * @returns {Promise}
 */
export function toggleAREffect(options: Object, jitsiTrack: Object) {
    return async function(dispatch: Object => Object, getState: () => any) {
        await dispatch(arEnabled(options.enabled));
        await dispatch(setAR(options));
        const state = getState();
        const arOption = state['features/ar-effect'];

        if (jitsiTrack) {
            try {
                if (options.enabled) {
                    await jitsiTrack.setEffect(await createAREffect(arOption, dispatch));
                } else {
                    await jitsiTrack.setEffect(undefined);
                    dispatch(arEnabled(false));
                }
            } catch (error) {
                dispatch(arEnabled(false));
                logger.error('Error on apply background effect:', error);
            }
        }
    };
}

/**
 * Sets the selected virtual background image object.
 *
 * @param {Object} options - Represents the virtual background setted options.
 * @returns {{
 *     type: SET_VIRTUAL_BACKGROUND,
 *     virtualSource: string,
 *     blurValue: number,
 *     type: string,
 * }}
 */
export function setAR(options: Object) {
    return {
        type: SET_AR,
        arSource: options?.url,
    };
}

/**
 * Signals the local participant that the background effect has been enabled.
 *
 * @param {boolean} backgroundEffectEnabled - Indicate if virtual background effect is activated.
 * @returns {{
 *      type: BACKGROUND_ENABLED,
 *      backgroundEffectEnabled: boolean
 * }}
 */
export function arEnabled(arEffectEnabled: boolean) {
    return {
        type: AR_ENABLED,
        arEffectEnabled
    };
}
