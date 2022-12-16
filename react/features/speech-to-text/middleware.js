// @flow

import { MiddlewareRegistry } from '../base/redux';
import { getLocalParticipant, getParticipantDisplayName } from '../base/participants';
import RecordRTC from './RecordRTC';

import { updateWSServer, updateRecorder, updateSTTMessage, removeSTTMessage } from './actions';
import {
    STT_TOGGLE_MESSAGE,
    ENDPOINT_MESSAGE_RECEIVED
} from './actionTypes';
import logger from './logger';
import { getLocalJitsiAudioTrack } from '../base/tracks';

import './subscriber';

const JSON_TYPE_STT_RESULT = 'stt-result';

const REMOVE_AFTER_MS = 3000;

MiddlewareRegistry.register(store => next => action => {
    switch(action.type) {
    case ENDPOINT_MESSAGE_RECEIVED:
        return _endpointMessageReceived(store, next, action);
    case STT_TOGGLE_MESSAGE:
        _setWSServer(store, action);
        break;
    }
    return next(action);
});

function _setWSServer({ dispatch, getState }, action) {
    let wsSoc, recorder;
    const state = getState();
    const { conference } = state['features/base/conference'];

    if(action.enabled){
        const roomId = conference.getMeetingUniqueId();
        const pId = getLocalParticipant(state).id;
    
        const wsURL = 'wss://www.tkita.ai/api/V2/kedu';
        const targetStream = getLocalJitsiAudioTrack(state).stream;
        wsSoc = new WebSocket(wsURL);
        wsSoc.onopen = function () {
            let data = {
                'rsn': roomId,
                'ssn': pId,
                'el': 'ko'
            }
            wsSoc.send(JSON.stringify(data));
            activateWS(wsSoc, targetStream, pId, dispatch, getState);
        }
    }
    else {
        wsSoc = state['features/stt']._wsServer;
        if(wsSoc)
            wsSoc.close();
        wsSoc = undefined;

        recorder = state['features/stt']._recorder;
        if(recorder)
            recorder.destroy();
        recorder = undefined;
    }
    dispatch(updateWSServer(wsSoc));
    dispatch(updateRecorder(recorder));
}

function activateWS(soc, stream, pId, dispatch, getState) {
    const { conference } = getState()['features/base/conference'];
    soc.onmessage = function (event) {
        const resultSTT = JSON.parse(event.data);
        if (resultSTT['code'] === 'EngineIsReady') {
            // 엔진이 준비되면 실행
            const recorder = RecordRTC(stream, {
                type: 'audio',
                recorderType: RecordRTC.StereoAudioRecorder,
                timeSlice: 100,
                desiredSampRate: 16000,
                numberOfAudioChannels: 1,
                ondataavailable: function (blob) {
                    const reader = new FileReader();
                    reader.addEventListener('loadend', () => {
                        soc.send(reader.result);
                    });
                    reader.readAsArrayBuffer(blob);
                },
            });
            recorder.startRecording();
            dispatch(updateRecorder(recorder));
        }
        else if (resultSTT['code'] === 'STTResult'){
            // for me
            createSTTMessage(dispatch, getState, {
                participantId: pId,
                text: resultSTT.data.result,
                isComplete: resultSTT.data.complete
            });
        
            // for others
            if (conference.getParticipantCount(getState()) > 1){
                conference.sendEndpointMessage('', {
                    type: JSON_TYPE_STT_RESULT,
                    participantId: pId,
                    text: resultSTT.data.result,
                    isComplete: resultSTT.data.complete
                });
            }
        }
    }
}

function createSTTMessage(dispatch, getState, json) {
    const state = getState();

    try {
        const participantId = json.participantId;
        const text = json.text;

        const newSTTMessage = {
            ...state['features/stt']._transcriptMessages
            .get(participantId)
        || { participantId }
        };

        _setClearerOnSTTMessage(dispatch, participantId, newSTTMessage);

        const dispName = getParticipantDisplayName(state, participantId);
        newSTTMessage.final = text;
        newSTTMessage.name = dispName;
        dispatch(updateSTTMessage(participantId, newSTTMessage));
    }
    catch (error) {
        logger.error('Error occurred while updating stt\n', error);
    }
}

function _endpointMessageReceived({ dispatch, getState }, next, action) {
    const { json } = action;

    if (!(json
        && json.type === JSON_TYPE_STT_RESULT)) {
    return next(action);
    }

    createSTTMessage(dispatch, getState, json);

    return next(action);
}

function _setClearerOnSTTMessage(
    dispatch,
    participantId,
    STTMessage) {
    if (STTMessage.clearTimeOut) {
        clearTimeout(STTMessage.clearTimeOut);
    }

    STTMessage.clearTimeOut
        = setTimeout(
            () => dispatch(removeSTTMessage(participantId)),
            REMOVE_AFTER_MS);
}
