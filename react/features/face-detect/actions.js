import axios from 'axios';
import { MEDIA_TYPE } from '../base/media';
import { getLocalTrack } from '../base/tracks';
import { UPDATE_ATTENTION_STATUSES, START_FACE_DETECT, STOP_FACE_DETECT } from './actionTypes';
import { grantFaceDetect } from './functions';
import FaceDetect from './FaceDetect';
import { getAuthUrl } from '../../api/url';

let faceDetector;

export function startFaceDetect() {
    return async function(dispatch, getState) {
        const state = getState();
        const granted = await grantFaceDetect(state);

        if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
            throw new Error('FaceDetect not supported!');
        }
    
        try {
            faceDetector = new FaceDetect(dispatch, getState);
            faceDetector.startEffect(true /* granted */);

            dispatch({
                type: START_FACE_DETECT,
                started: true
            });
        } catch (err) {
            console.error('createFaceDetect is failed.', err);
        }
    };
}

export function stopFaceDetect() {
    console.log('==> stopFaceDetect');

    faceDetector?.stopEffect()
    faceDetector = null;

    return {
        type: STOP_FACE_DETECT,
        started: false
    };
}

export function refreshAttentionStatuses() {
    return function(dispatch, getState) {
        try {
            const state = getState()
            const apiBase = getAuthUrl(state);
            const { meetingId } = state['features/base/conference'].conference.room;
    
            axios.get(`${apiBase}/attentions/${meetingId}/latest`).then(resp => {
                dispatch({
                    type: UPDATE_ATTENTION_STATUSES,
                    statuses: resp.data,
                });
            });
        } catch (err) {
            console.error('updateAttentionStatuses is failed.', err);
        }
    };
}
