// @flow

import { MiddlewareRegistry } from '../base/redux';
import { getLocalParticipant, getParticipantById, getParticipantDisplayName } from '../base/participants';
import RecordRTC from './RecordRTC';

import { 
    updateWSServer,
    updateRetryCheck,
    updateRecorder,
    updateSTTMessage,
    removeSTTMessage,
    toggleSTTTranslation,
    updateTransMessage,
    removeTransMessage,
    addSTTMessageHistory } from './actions';
import {
    STT_TOGGLE_MESSAGE,
    ENDPOINT_MESSAGE_RECEIVED,
    STT_CHANGE_TARGET_LANGUAGE,
    STT_RETRY_REQUEST
} from './actionTypes';
import logger from './logger';
import { getLocalJitsiAudioTrack } from '../base/tracks';
import { i18next } from '../base/i18n';

import './subscriber';
import { showNotification, NOTIFICATION_TIMEOUT_TYPE } from '../notifications';

import {
    MESSAGE_TYPE_LOCAL,
    MESSAGE_TYPE_REMOTE
} from '../chat/constants';

const JSON_TYPE_STT_RESULT = 'stt-result';

const RETRY_AFTER_MS = 3000;
const REMOVE_AFTER_MS = 3000;

MiddlewareRegistry.register(store => next => action => {
    switch(action.type) {
    case ENDPOINT_MESSAGE_RECEIVED:
        return _endpointMessageReceived(store, next, action);
    case STT_TOGGLE_MESSAGE:
        _setWSServer(store, action);
        break;
    case STT_CHANGE_TARGET_LANGUAGE:
        _destorySTT(store.dispatch, store.getState);
        const new_action = {};
        new_action.enabled = true;
        new_action.targetLanguage = action.targetLanguage;
        _setWSServer(store, new_action);
        break;
    case STT_RETRY_REQUEST:
        _destorySTT(store.dispatch, store.getState);
        const new_action_2 = {};
        new_action_2.enabled = true;
        _setWSServer(store, new_action_2);
    }

    return next(action);
});

function _setWSServer({ dispatch, getState }, action) {
    let preSoc, wsSoc, recorder, targetLanguage = undefined;
    const state = getState();
    const { conference } = state['features/base/conference'];
    if (!conference){
        setTimeout(() => _setWSServer({dispatch, getState}, action), RETRY_AFTER_MS);
        return;
    }

    if(action.enabled){
        const roomId = conference.getMeetingUniqueId();
        const pId = getLocalParticipant(state).id;

        if(!roomId || !pId)
            return;
    
        const wsURL = window._env_.STT_WS_SERVER;
        const sttApiAccount = window._env_.STT_API_ACCOUNT;
        const sttApiPwd = window._env_.STT_API_PWD

        const currentAudioTrack = getLocalJitsiAudioTrack(state);
        const targetStream = currentAudioTrack? currentAudioTrack.stream : null;
        targetLanguage = action.targetLanguage || (i18next.language === 'ko'? 'ko' : 'en');

        preSoc = new WebSocket(wsURL);
        preSoc.onopen = function () {
            let data = {
                'rsn': roomId,
                'ssn': pId,
                'config': {
                    'auth': sttApiAccount,
                    'pass': sttApiPwd,
                    'el': targetLanguage
                }
            };
            preSoc.send(JSON.stringify(data));
            preSoc.onmessage = function (event) {
                const response = JSON.parse(event.data);
                //console.log('RESPONSE: ', response);
                if (response['code'] === 'EngineInfo'){
                    const connectUrl = response.data.connectionEngineURL;
                    const setData = response.data.setData;
                    const configData = response.data.configData;
                    
                    wsSoc = new WebSocket(connectUrl);
                    wsSoc.onopen = function() {
                        dispatch(updateWSServer(wsSoc, targetLanguage));
                        wsSoc.send(setData);
                        wsSoc.send(configData);
                        activateWS(wsSoc, targetStream, pId, dispatch, getState);
                    }
                    wsSoc.onclose = function (e) {
                        if(e.code != 1000)
                            dispatch(updateRetryCheck(true));
                    }
                }
            }
        }
        preSoc.onclose = function (e) {
            if(e.code != 1000)
                dispatch(updateRetryCheck(true));
        }
    }
    else {
        recorder = state['features/stt']._recorder;
        if(recorder && typeof recorder.destroy !== "undefined")
            recorder.destroy();
        recorder = undefined;

        wsSoc = state['features/stt']._wsServer;
        if(wsSoc)
            wsSoc.close(1000);
        wsSoc = undefined;

        dispatch(toggleSTTTranslation(false));
        dispatch(updateRecorder(recorder));
        dispatch(updateWSServer(wsSoc, targetLanguage));
    }
    if(action.enabled && !action.targetLanguage){
        dispatch(showNotification({
            titleKey: 'stt.notifications.title',
            descriptionKey: 'stt.notifications.enabled',
            concatText: true,
            maxLines: 2
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
    }
}

function _destorySTT(dispatch, getState){
    const state = getState();
    
    let recorder = state['features/stt']._recorder;
    if(recorder && typeof recorder.destroy !== "undefined")
        recorder.destroy();
    recorder = undefined;

    let wsSoc = state['features/stt']._wsServer;
    if(wsSoc)
        wsSoc.close(1000);
    wsSoc = undefined;

    dispatch(updateWSServer(wsSoc));
    dispatch(updateRecorder(recorder));
}

function activateWS(soc, stream, pId, dispatch, getState) {
    const { conference } = getState()['features/base/conference'];
    soc.onmessage = function (event) {
        const resultSTT = JSON.parse(event.data);
        //console.log('RESULT: ', resultSTT);
        if (resultSTT['code'] === 'EngineActivate') {
            // 엔진이 준비되면 실행
            if(!stream){
                const recorder = 'update-later';
                dispatch(updateRecorder(recorder));
            }
            else {
                try {
                    const recorder = RecordRTC(stream, {
                        type: 'audio',
                        recorderType: RecordRTC.StereoAudioRecorder,
                        timeSlice: 100,
                        desiredSampRate: 16000,
                        numberOfAudioChannels: 1,
                        ondataavailable: function (blob) {
                            try{
                                const reader = new FileReader();
                                reader.addEventListener('loadend', () => {
                                    soc.send(reader.result);
                                });
                                reader.readAsArrayBuffer(blob);
                            }
                            catch (e) {
                                dispatch(updateRetryCheck(true));
                            }
                        },
                    });
                    recorder.startRecording();
                    dispatch(updateRecorder(recorder));
                }
                catch (e){
                    dispatch(updateRetryCheck(true));
                }
            }
        }
        else if (resultSTT['code'] === 'STTResult'){
            if(!resultSTT.data.result)
                return;
            // for me
            createSTTMessage(dispatch, getState, {
                participantId: pId,
                text: resultSTT.data.result,
                isComplete: resultSTT.data.complete,
                isTranslated: false,
                sentenceId: pId + resultSTT.data.st
            });

            const lang = getState()['features/stt']._targetLanguage === 'ko'? 'ko' : 'en';
            // for others
            if (conference.getParticipantCount(getState()) > 1){
                conference.sendEndpointMessage('', {
                    type: JSON_TYPE_STT_RESULT,
                    participantId: pId,
                    text: resultSTT.data.result,
                    isComplete: resultSTT.data.complete,
                    lang: lang,
                    st: resultSTT.data.st,
                    et: resultSTT.data.et
                });
            }
        }
    }
}

function createSTTMessage(dispatch, getState, json) {
    const state = getState();
    try {
        const sentenceId = json.sentenceId;
        const participantId = json.participantId;
        const text = json.text;
        const isTranslated = json.isTranslated;
        let newSTTMessage;

        if (!isTranslated) {
            const { isOpen: isChatOpen } = state['features/chat'];
            const participant = getParticipantById(state, participantId) || {};
            const localParticipant = getLocalParticipant(getState);
            const displayName = participant.name || getParticipantDisplayName(state, id);
            const hasRead = participant.local || isChatOpen;
            const timestampToDate = json.st ? new Date(json.st) : new Date();
            const millisecondsTimestamp = timestampToDate.getTime();

            dispatch(addSTTMessageHistory({
                displayName,
                hasRead,
                id: participantId,
                messageType: participant.local ? MESSAGE_TYPE_LOCAL : MESSAGE_TYPE_REMOTE,
                message: text,
                privateMessage: false,
                recipient: getParticipantDisplayName(state, localParticipant.id),
                timestamp: millisecondsTimestamp,
                isReaction: false,
                sentenceId: json.sentenceId
            }));
        }

        if(!state['features/stt']._subtitleVisible)
            return;

        if(isTranslated){
            newSTTMessage = {
                ...state['features/stt']._translationMessages
                .get(sentenceId)
            || { sentenceId }
            };
            _setClearerOnTransMessage(dispatch, sentenceId, newSTTMessage);
        }
        else{
            newSTTMessage = {
                ...state['features/stt']._transcriptMessages
                .get(sentenceId)
            || { sentenceId }
            };
            _setClearerOnSTTMessage(dispatch, sentenceId, newSTTMessage);
        }

        const dispName = getParticipantDisplayName(state, participantId);
        newSTTMessage.final = text;
        newSTTMessage.name = dispName;
        newSTTMessage.isTranslated = isTranslated;

        if (isTranslated)
            dispatch(updateTransMessage(sentenceId, newSTTMessage));
        else {
            dispatch(updateSTTMessage(sentenceId, newSTTMessage));
        }
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
    //console.log('MESSAGE: ', json);
    json.isTranslated = false;
    json.sentenceId = json.participantId + json.st;
    createSTTMessage(dispatch, getState, json);

    // 번역 기능이 켜져있고 isComplete가 True이고, 현재 나와 언어가 다른 경우
    if(getState()['features/stt']._translationEnabled && json.isComplete && json.lang !== getState()['features/stt']._targetTransLanguage){
        const param_data = {};
        param_data.SourceLanguage = json.lang;
        param_data.SourceContent = json.text;
        param_data.TargetLanguage = getState()['features/stt']._targetTransLanguage;
        param_data.ssn = json.participantId;
        param_data.st = json.st;
        param_data.et = json.et;
        const st_param_data = JSON.stringify(param_data);
        //console.log(st_param_data);

        const targetUrl = window._env_.STT_API_SERVER + '/getTranslateContent?data=' + st_param_data;
        try {
            fetch(targetUrl)
            .then(resp => resp.json())
            .then(resultData => {
                const translatedJson = {};
                translatedJson.text = resultData.data.result;
                translatedJson.participantId = json.participantId;
                translatedJson.isTranslated = true;
                translatedJson.sentenceId = json.participantId + json.st;
                createSTTMessage(dispatch, getState, translatedJson);
            });
        } catch(e){
            console.log(e);
        }
    }

    return next(action);
}

function _setClearerOnSTTMessage(
    dispatch,
    sentenceId,
    STTMessage) {
    if (STTMessage.clearTimeOut) {
        clearTimeout(STTMessage.clearTimeOut);
    }

    STTMessage.clearTimeOut
        = setTimeout(
            () => dispatch(removeSTTMessage(sentenceId)),
            REMOVE_AFTER_MS);
}

function _setClearerOnTransMessage(
    dispatch,
    sentenceId,
    STTMessage) {
    if (STTMessage.clearTimeOut) {
        clearTimeout(STTMessage.clearTimeOut);
    }

    STTMessage.clearTimeOut
        = setTimeout(
            () => dispatch(removeTransMessage(sentenceId)),
            REMOVE_AFTER_MS);
}
