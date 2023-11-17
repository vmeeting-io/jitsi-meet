// @flow

import { JitsiTrackEvents } from '../base/lib-jitsi-meet';
import { updateSettings } from '../base/settings';

import { togglePoseEffect } from './actions';

/**
 * Check if the local desktop track was stopped and apply none option on virtual background.
 *
 * @param {Function} dispatch - The Redux dispatch function.
 * @param {Object} desktopTrack - The desktop track that needs to be checked if it was stopped.
 * @param {Object} currentLocalTrack - The current local track where we apply none virtual
 * background option if the desktop track was stopped.
 * @returns {Promise}
 */
export function localTrackStopped(dispatch: Function, desktopTrack: Object, currentLocalTrack: Object) {
    const noneOptions = {
        enabled: false,
        view3D: false,
        viewOnCam: false
    };

    desktopTrack
    && desktopTrack.on(JitsiTrackEvents.LOCAL_TRACK_STOPPED, () => {
        dispatch(togglePoseEffect(noneOptions, currentLocalTrack));

        // Set x scale to default value.
        dispatch(updateSettings({
            localFlipX: true
        }));
    });
}