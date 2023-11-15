import { filter } from 'lodash';

import {
    TOGGLE_POSEDEMO,
    TOGGLE_3D_VIEW,
    TOGGLE_VIEW_ON_CAM
} from './actionTypes';

import { createPoseEffect } from '../stream-effects/pose-effect';


export function togglePoseEffect(options: Object, jitsiTrack: Object) {
    return async function(dispatch: Object => Object, getState: () => any) {
        await dispatch(poseEnabled(options.enabled));
        await dispatch(toggle3DView(options.view3D));
        await dispatch(toggleViewOnCam(options.viewOnCam));

        const state = getState();
        const pose = state['features/posedemo'];

        if (jitsiTrack) {
            try {
                if (options.enabled) {
                    await jitsiTrack.setEffect(await createPoseEffect(pose, dispatch));
                } else {
                    await jitsiTrack.setEffect(undefined);
                    dispatch(poseEnabled(false));
                    dispatch(toggle3DView(false));
                    dispatch(toggleViewOnCam(false));
                }
            } catch (error) {
                dispatch(poseEnabled(false));
                dispatch(toggle3DView(false));
                dispatch(toggleViewOnCam(false));
                logger.error('Error on apply pose effect:', error);
            }
        }
    };
}

export function poseEnabled(enable: boolean) {
    return {
        type: TOGGLE_POSEDEMO,
        enabled: enable
    };
}
export function toggle3DView(enable: boolean) {
    return {
        type: TOGGLE_3D_VIEW,
        view3D: enable
    };
}

export function toggleViewOnCam(enable: boolean) {
    return {
        type: TOGGLE_VIEW_ON_CAM,
        viewOnCam: enable
    };
}