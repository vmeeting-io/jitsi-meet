import { difference, filter, flattenDeep, isEmpty, last, map } from 'lodash';

import { getCurrentConference } from '../base/conference';
import {
    getLocalParticipant,
    getRemoteParticipants,
} from '../base/participants';
import { getBreakoutRooms } from '../breakout-rooms/functions';

import {
    INIT_FACE_DETECT,
    STOP_FACE_DETECT,
    ATTENTION_ANALYSIS_OPENED,
    START_FACE_DETECT,
    SET_ATTENTION_ANALYSIS_READY,
    SET_ATTENTION_ANALYSIS_COUNT,
    SET_ATTENTION_ANALYSIS_TOTAL,
    SET_STATUS_MAP,
} from './actionTypes';
import {
    getAttentionAnalysisWindow,
    getFaceDetector,
    getStatusMap,
} from './functions';
import FaceDetect from './FaceDetect';

const AUTH_PAGE_BASE = window._env_.VMEETING_FRONT_BASE;

export function initFaceDetect() {
    return function(dispatch, getState) {
        if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
            throw new Error('FaceDetect not supported!');
        }
    
        const state = getState();
        
        console.log('==> initFaceDetect');
        let instance = getFaceDetector(state);
        if (!instance) {
            instance = new FaceDetect(dispatch, getState);
        }
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

        if (state['features/did-consent'].permit) {
            const instance = getFaceDetector(state);
            instance?.start();
    
            dispatch({
                type: START_FACE_DETECT,
                instance
            });
        }
    };
}

export function stopFaceDetect() {
    return function(dispatch, getState) {
        console.log('==> stopFaceDetect');
        const state = getState();
        const instance = getFaceDetector(state);
        instance?.stop();

        dispatch({ type: STOP_FACE_DETECT });
    };
}

export function openAttentionAnalysis() {
    return function(dispatch, getState) {
        const state = getState();
        let childWindow = getAttentionAnalysisWindow(state);
        
        if (!childWindow) {
            const { roomInfo } = state['features/base/conference'];

            childWindow = window.open(
                `${AUTH_PAGE_BASE}/learnersattention?roomId=${roomInfo._id}`,
                '_blank',
                'status=no,location=no,titlebar=no,directories=no,toolbar=no,menubar=no,width=1024,height=700,left=100,top=100'
            );

            dispatch({
                type: ATTENTION_ANALYSIS_OPENED,
                childWindow
            });

            childWindow.onload = () => {
                dispatch(updateAttentionAnalysis());
                window.addEventListener('beforeunload', () => {
                    dispatch(closeAttentionAnalysis());
                });
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
        const conference = getCurrentConference(state);

        if (childWindow && conference) {
            const rooms = { ...getBreakoutRooms(state) };
            const statusMap = getStatusMap(state);

            if (isEmpty(rooms)) {
                const remote = getRemoteParticipants(state);
                const participants = {};
                for (const [id, { role, name: displayName }] of remote) {
                    const jid = conference.getParticipantById(id)?.getJid();
                    participants[id] = { displayName, id, jid, role };
                }

                const { id, role, name: displayName } = getLocalParticipant(state);
                const jid = state['features/base/connection'].connection?.getJid();
                participants[id] = { displayName, id, jid, role };

                const name = conference.getName();
                rooms[name] = {
                    id: name,
                    isMainRoom: true,
                    jid: conference.room.roomjid,
                    name,
                    participants
                };
            } else {
                const participantIDs = flattenDeep(
                    map(rooms, r => map(r.participants, 'id'))
                );
                // delete left participant
                difference([...statusMap.keys()], participantIDs).forEach(id => {
                    statusMap.delete(id);
                });
                // insert joined participant
                filter(participantIDs, id => !statusMap.has(id)).forEach(id => {
                    statusMap.set(id, undefined);
                });
                dispatch({ type: SET_STATUS_MAP, statusMap });
            }

            console.log('updateAttentionAnalysis:', rooms);
            childWindow.postMessage({
                type: 'update-attentions',
                rooms,
                statusMap
            });
        }
    }
}

export function updateAttentionStatus({ id, status }) {
    return function(dispatch, getState) {
        const state = getState();
        const statusMap = getStatusMap(state);

        statusMap.set(id, status);
        dispatch({ type: SET_STATUS_MAP, statusMap });
        
        const childWindow = getAttentionAnalysisWindow(state);
        if (childWindow) {
            childWindow.postMessage({ type: 'update-status', statusMap });
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
