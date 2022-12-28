// @flow

import { v4 as uuidv4 } from 'uuid';

import { ReducerRegistry } from "../base/redux";
import { i18next } from '../base/i18n';
import {
    STT_TOGGLE_MESSAGE,
    STT_TRANSLATION_TOGGLE_MESSAGE,
    STT_WS_SERVER_MESSAGE,
    STT_RECORDER_MESSAGE,
    UPDATE_STT_MESSAGE,
    REMOVE_STT_MESSAGE,
    STT_CHANGE_TARGET_LANGUAGE,
    UPDATE_TRANS_MESSAGE,
    REMOVE_TRANS_MESSAGE,
    CHANGE_SUBTITLE_FONT_SIZE,
    ADD_STT_HISTORY,
    STT_CHANGE_TARGET_TRANS_LANGUAGE
} from './actionTypes';

/**
 * Default State for 'features/transcription' feature.
 */
const defaultState = {
    _sttEnabled: false,
    _translationEnabled: false,
    _minutesEnabled: false,
    _transcriptMessages: new Map(),
    _translationMessages: new Map(),
    _wsServer: undefined,
    _recorder: undefined,
    _targetLanguage: undefined,
    _targetTransLanguage: undefined,
    _fontSize: 'small',
    _sttHistory: []
};

ReducerRegistry.register('features/stt', (
        state = defaultState, action) => {
    switch (action.type) {
    case STT_TOGGLE_MESSAGE:
        return {
            ...state,
            _sttEnabled: action.enabled
        };
    case STT_CHANGE_TARGET_LANGUAGE:
        return {
            ...state,
            _targetLanguage: action.targetLanguage
        }
    case STT_TRANSLATION_TOGGLE_MESSAGE:
        return {
            ...state,
            _translationEnabled: action.enabled,
            _targetTransLanguage: action.enabled? action.targetLanguage || i18next.language : undefined
        };
    case STT_CHANGE_TARGET_TRANS_LANGUAGE:
        return {
            ...state,
            _targetTransLanguage: action.targetLanguage
        }
    case STT_WS_SERVER_MESSAGE:
        return {
            ...state,
            _wsServer: action.wsSoc,
            _targetLanguage: action.currentTargetLanguage
        };
    case STT_RECORDER_MESSAGE:
        return {
            ...state,
            _recorder: action.recorder
        };
    case UPDATE_STT_MESSAGE:
        return _updateSTTMessage(state, action);
    case REMOVE_STT_MESSAGE:
        return _removeSTTMessage(state, action);
    case UPDATE_TRANS_MESSAGE:
        return _updateTransMessage(state, action);
    case REMOVE_TRANS_MESSAGE:
        return _removeTransMessage(state, action);
    case CHANGE_SUBTITLE_FONT_SIZE:
        return {
            ...state,
            _fontSize: action.targetSize
        };
    case ADD_STT_HISTORY: {
            let found = false;
            const newMessage = {
                displayName: action.displayName,
                error: action.error,
                id: action.id,
                isReaction: action.isReaction,
                messageId: action.sentenceId,
                messageType: action.messageType,
                message: action.message,
                privateMessage: action.privateMessage,
                recipient: action.recipient,
                timestamp: action.timestamp
            };

            let messages = state._sttHistory.map(m => {
                if (m.messageId === newMessage.messageId) {
                    found = true;
    
                    return newMessage;
                }
    
                return m;
            });

            if (!found){
                messages = navigator.product === 'ReactNative'
                ? [
                    newMessage,
                    ...state._sttHistory
                ]
                : [
                    ...state._sttHistory,
                    newMessage
                ];
            }

            return {
                ...state,
                _sttHistory: messages
            };
        }
    }

    return state;
});

function _updateSTTMessage(state,
        { sentenceId, newSTTMessage }) {
    const newTranscriptMessages = new Map(state._transcriptMessages);

    // Updates the new message for the given key in the Map.
    newTranscriptMessages.set(sentenceId, newSTTMessage);

    return {
        ...state,
        _transcriptMessages: newTranscriptMessages
    };
}

function _removeSTTMessage(state, { sentenceId }) {
    const newTranscriptMessages = new Map(state._transcriptMessages);

    // Deletes the key from Map once a final message arrives.
    newTranscriptMessages.delete(sentenceId);

    return {
        ...state,
        _transcriptMessages: newTranscriptMessages
    };
}

function _updateTransMessage(state,
    { sentenceId, newSTTMessage }) {
    const newTranslationMessages = new Map(state._translationMessages);

    // Updates the new message for the given key in the Map.
    newTranslationMessages.set(sentenceId, newSTTMessage);

    return {
        ...state,
        _translationMessages: newTranslationMessages
    };
}

function _removeTransMessage(state, { sentenceId }) {
    const newTranslationMessages = new Map(state._translationMessages);

    // Deletes the key from Map once a final message arrives.
    newTranslationMessages.delete(sentenceId);

    return {
        ...state,
        _translationMessages: newTranslationMessages
    };
}