import { filter } from 'lodash';
import { START_FACE_DETECT, STOP_FACE_DETECT, ATTENTION_ANALYSIS_OPENED } from './actionTypes';
import { grantFaceDetect } from './functions';
import FaceDetect from './FaceDetect';
import { getCurrentConference } from '../base/conference';
import { getAttentionAnalysisWindow } from '.';
import { getLocalParticipant, getRemoteParticipants, getRemoteParticipantsSorted } from '../base/participants';

let faceDetector;
const AUTH_PAGE_BASE = process.env.VMEETING_FRONT_BASE;

export function startFaceDetect() {
    return async function(dispatch, getState) {
        if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
            throw new Error('FaceDetect not supported!');
        }
    
        const state = getState();
        // const granted = await grantFaceDetect(state);
        
        faceDetector = new FaceDetect(dispatch, getState);
        faceDetector.startEffect(true /* granted */);
        dispatch({
            type: START_FACE_DETECT,
            started: true
        });
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

export function openAttentionAnalysis() {
    return function(dispatch, getState) {
        const state = getState();
        let childWindow = getAttentionAnalysisWindow(state);
        
        if (!childWindow) {
            const conference = getCurrentConference(state);
            const meetingId = conference.room.meetingId;

            childWindow = window.open(
                `${AUTH_PAGE_BASE}/learnersattention?meetingId=${meetingId}`,
                '_blank',
                'status=no,location=no,titlebar=no,directories=no,toolbar=no,menubar=no,width=1024,height=700,left=100,top=100'
            );

            dispatch({
                type: ATTENTION_ANALYSIS_OPENED,
                childWindow
            });

            childWindow.onload = () => {
                dispatch(updateAttentionAnalysis());
            };
        } else {
            childWindow.focus();
        }
    }
}

export function closeAttentionAnalysis() {
    return function(dispatch, getState) {
        const state = getState();
        let childWindow = getAttentionAnalysisWindow(state);

        if (childWindow) {
            childWindow.close();
        }
    }
}

export function updateAttentionAnalysis() {
    return function(dispatch, getState) {
        const state = getState();
        const childWindow = getAttentionAnalysisWindow(state);

        if (childWindow) {
            const remote = getRemoteParticipants(state);
            const participants = filter(getRemoteParticipantsSorted(state).map(pid => {
                const { id, avatarURL, name, presence } = remote.get(pid) || {};
                return id ? { id, avatarURL, name, status: presence } : null;
            }));

            const { id, avatarURL, name, presence } = getLocalParticipant(state);
            participants.unshift({ id, avatarURL, name, status: presence });

            childWindow.postMessage({
                type: 'update-attentions',
                participants
            });
        }
    }
}
