// @flow


import { timeout } from '../../virtual-avatar/functions';
import logger from '../../virtual-avatar/logger';

import JitsiStreamVirtualAvatarEffect from './JitsiStreamVirtualAvatarEffect';

import * as mpFaceMesh from '@mediapipe/face_mesh';

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

    const config = {
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@` +
                `${mpFaceMesh.VERSION}/${file}`;
        }
    };

    const faceMesh = new mpFaceMesh.FaceMesh(config);

    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    // Checks if WebAssembly feature is supported or enabled by/in the browser.
    // Conditional import of wasm-check package is done to prevent
    // the browser from crashing when the user opens the app.

    const options = {
        virtualAvatar
    };

    return new JitsiStreamVirtualAvatarEffect(faceMesh, options);
}
