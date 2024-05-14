// @flow

import { getAuthUrl } from '../../../api/url';
import { NoiseSuppressionEffect } from '../../stream-effects/noise-suppression/NoiseSuppressionEffect';
import { createVirtualBackgroundEffect } from '../../stream-effects/virtual-background';
// import { createVirtualAvatarEffect } from '../../stream-effects/virtual-avatar';
import { createAREffect } from '../../stream-effects/ar-effect';

import logger from './logger';

/**
 * Loads the enabled stream effects.
 *
 * @param {Object} store - The Redux store.
 * @returns {Promise} - A Promise which resolves when all effects are created.
 */
export default function loadEffects(store: Object): Promise<any> {
    const state = store.getState();
    const virtualBackground = state['features/virtual-background'];
    // const virtualAvatar = state['features/virtual-avatar'];
    const noiseSuppression = state['features/noise-suppression'];
    const { noiseSuppression: nsOptions } = state['features/base/config'];
    const ar = state['features/ar-effect'];
    const apiBase = getAuthUrl(state);

    // const virtualAvatarPromise = virtualAvatar.virtualAvatarEffectEnabled
    //     ? createVirtualAvatarEffect({ ...virtualAvatar, apiBase }, store.dispatch)
    //         .catch(error => {
    //             logger.error('Failed to obtain the virtual avatar effect instance with error: ', error);

    //             return Promise.resolve();
    //         })
    //     : Promise.resolve();

    const backgroundPromise = virtualBackground.backgroundEffectEnabled
        ? createVirtualBackgroundEffect({ ...virtualBackground, apiBase }, store.dispatch)
            .catch(error => {
                logger.error('Failed to obtain the background effect instance with error: ', error);

                return Promise.resolve();
            })
        : Promise.resolve();

    const arPromise = ar.arEffectEnabled
        ? createAREffect({ ...ar, apiBase })
            .catch(error => {
                logger.error('Failed to obtain the background effect instance with error: ', error);

                return Promise.resolve();
            })
        : Promise.resolve();

    const noiseSuppressionPromise = noiseSuppression?.enabled
        ? Promise.resolve(new NoiseSuppressionEffect(nsOptions))
        : Promise.resolve();

    return Promise.all([
        // virtualAvatarPromise,
        backgroundPromise,
        arPromise,
        noiseSuppressionPromise,
    ]);
}
