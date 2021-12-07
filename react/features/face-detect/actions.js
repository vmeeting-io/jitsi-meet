import { filter } from 'lodash';

import { getCurrentConference } from '../base/conference';
import {
    getLocalParticipant,
    getRemoteParticipants,
    getRemoteParticipantsSorted
} from '../base/participants';

import {
    INIT_FACE_DETECT,
    STOP_FACE_DETECT,
    ATTENTION_ANALYSIS_OPENED,
    START_FACE_DETECT,
    SET_ATTENTION_ANALYSIS_READY,
    SET_ATTENTION_ANALYSIS_COUNT,
    SET_ATTENTION_ANALYSIS_TOTAL
} from './actionTypes';
import {
    getAttentionAnalysisWindow,
    getFaceDetector,
    grantFaceDetect
} from './functions';
import FaceDetect from './FaceDetect';

const AUTH_PAGE_BASE = process.env.VMEETING_FRONT_BASE;

export function initFaceDetect() {
    return function(dispatch, getState) {
        if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
            throw new Error('FaceDetect not supported!');
        }
    
        const state = getState();
        // const granted = await grantFaceDetect(state);
        
        console.log('==> initFaceDetect');
        const instance = new FaceDetect(dispatch, getState);
        instance.init();

        dispatch({
            type: INIT_FACE_DETECT,
            instance
        });
    };
}

export function startFaceDetect() {
    return function(dispatch, getState) {
        console.log('==> startFaceDetect');
        const state = getState();
        const instance = getFaceDetector(state);
        instance?.start();

        dispatch({
            type: START_FACE_DETECT,
            instance
        });
    };
}

export function stopFaceDetect() {
    return function(dispatch, getState) {
        console.log('==> stopFaceDetect');
        const state = getState();
        const instance = getFaceDetector(state);
        instance?.stop();

        dispatch({
            type: STOP_FACE_DETECT,
            instance: null
        });
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

export function setAttentionAnalysisReady(ready) {
    return {
        type: SET_ATTENTION_ANALYSIS_READY,
        ready
    };
}

export function setAttentionAnalysisCount(count) {
    return {
        type: SET_ATTENTION_ANALYSIS_COUNT,
        count
    };
}

export function setAttentionAnalysisTotal(total) {
    return {
        type: SET_ATTENTION_ANALYSIS_TOTAL,
        total
    };
}
