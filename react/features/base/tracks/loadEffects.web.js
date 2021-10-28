// @flow

import { getAuthUrl } from '../../../api/url';
import { createScreenshotCaptureEffect } from '../../stream-effects/screenshot-capture';
import { createVirtualBackgroundEffect } from '../../stream-effects/virtual-background';
import { createAREffect } from '../../stream-effects/ar-effect';

import logger from './logger';

/**
 * Loads the enabled stream effects.
 *
 * @param {Object} store - The Redux store.
 * @returns {Promsie} - A Promise which resolves when all effects are created.
 */
export default function loadEffects(store: Object): Promise<any> {
    const state = store.getState();
    const virtualBackground = state['features/virtual-background'];
    const ar = state['features/ar-effect'];
    const apiBase = getAuthUrl(state);

    const arPromise = ar.arEffectEnabled
        ? createAREffect({ ...ar, apiBase })
            .catch(error => {
                logger.error('Failed to obtain the background effect instance with error: ', error);

                return Promise.resolve();
            })
        : Promise.resolve();

    const backgroundPromise = virtualBackground.backgroundEffectEnabled
        ? createVirtualBackgroundEffect({ ...virtualBackground, apiBase }, store.dispatch)
            .catch(error => {
                logger.error('Failed to obtain the background effect instance with error: ', error);

                return Promise.resolve();
            })
        : Promise.resolve();
    const screenshotCapturePromise = state['features/screenshot-capture']?.capturesEnabled
        ? createScreenshotCaptureEffect(state)
            .catch(error => {
                logger.error('Failed to obtain the screenshot capture effect effect instance with error: ', error);

                return Promise.resolve();
            })
        : Promise.resolve();

    return Promise.all([ backgroundPromise, screenshotCapturePromise, arPromise ]);
}
