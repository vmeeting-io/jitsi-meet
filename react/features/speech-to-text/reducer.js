import { ReducerRegistry } from "../base/redux";

import {
    STT_TOGGLE_MESSAGE,
    STT_TRANSLATION_TOGGLE_MESSAGE,
    STT_WS_SERVER_MESSAGE,
    STT_RECORDER_MESSAGE,
    UPDATE_STT_MESSAGE,
    REMOVE_STT_MESSAGE,
    STT_CHANGE_TARGET_LANGUAGE,
    UPDATE_TRANS_MESSAGE,
    REMOVE_TRANS_MESSAGE
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
    _targetLanguage: undefined
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
            _currentLanguage: action.targetLanguage
        }
    case STT_TRANSLATION_TOGGLE_MESSAGE:
        return {
            ...state,
            _translationEnabled: action.enabled
        };
    case STT_WS_SERVER_MESSAGE:
        return {
            ...state,
            _wsServer: action.wsSoc,
            _currentLanguage: action.currentLanguage
        };
    case STT_RECORDER_MESSAGE:
        return {
            ...state,
            _recorder: action.recorder
        }
    case UPDATE_STT_MESSAGE:
        return _updateSTTMessage(state, action);
    case REMOVE_STT_MESSAGE:
        return _removeSTTMessage(state, action);
    case UPDATE_TRANS_MESSAGE:
        return _updateTransMessage(state, action);
    case REMOVE_TRANS_MESSAGE:
        return _removeTransMessage(state, action);
    }

    return state;
});

function _updateSTTMessage(state,
        { participantId, newSTTMessage }) {
    const newTranscriptMessages = new Map(state._transcriptMessages);

    // Updates the new message for the given key in the Map.
    newTranscriptMessages.set(participantId, newSTTMessage);

    return {
        ...state,
        _transcriptMessages: newTranscriptMessages
    };
}

function _removeSTTMessage(state, { participantId }) {
    const newTranscriptMessages = new Map(state._transcriptMessages);

    // Deletes the key from Map once a final message arrives.
    newTranscriptMessages.delete(participantId);

    return {
        ...state,
        _transcriptMessages: newTranscriptMessages
    };
}

function _updateTransMessage(state,
    { participantId, newSTTMessage }) {
    const newTranslationMessages = new Map(state._translationMessages);

    // Updates the new message for the given key in the Map.
    newTranslationMessages.set(participantId, newSTTMessage);

    return {
        ...state,
        _translationMessages: newTranslationMessages
    };
}

function _removeTransMessage(state, { participantId }) {
    const newTranslationMessages = new Map(state._translationMessages);

    // Deletes the key from Map once a final message arrives.
    newTranslationMessages.delete(participantId);

    return {
        ...state,
        _translationMessages: newTranslationMessages
    };
}