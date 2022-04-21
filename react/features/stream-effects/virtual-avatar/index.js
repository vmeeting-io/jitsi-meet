// @flow


import { timeout } from '../../virtual-avatar/functions';
import logger from '../../virtual-avatar/logger';

import JitsiStreamVirtualAvatarEffect from './JitsiStreamVirtualAvatarEffect';

import * as mpHolistic from '@mediapipe/holistic';

/**
 * Creates a new instance of JitsiStreamVirtualAvatarEffect. This loads the Meet virtual avatar model that is used to
 * extract person segmentation.
 *
 * @param {Object} virtualAvatar - The virtual object that contains the virtual avatar source and
 * the isVirtualAvatar flag that indicates if virtual image is activated.
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {Promise<JitsiStreamVirtualAvatarEffect>}
 */
export async function createVirtualAvatarEffect(virtualAvatar: Object, dispatch: Function) {
    if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
        throw new Error('JitsiStreamVirtualAvatarEffect not supported!');
    }

    const virtualAvatarEffect = new JitsiStreamVirtualAvatarEffect(virtualAvatar);
    virtualAvatarEffect.load3DModel(virtualAvatar.selectedVirtualAvatarUrl);
    virtualAvatarEffect.setBackground(virtualAvatar.selectedBackgroundUrl);

    return virtualAvatarEffect;
}
