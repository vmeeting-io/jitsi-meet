// @flow
import { openDialog, hideDialog } from '../base/dialog';
import { STTDialog } from './components/stt-dialog';
import { 
    STT_TOGGLE_MESSAGE,
    STT_CHANGE_TARGET_LANGUAGE,
    STT_TRANSLATION_TOGGLE_MESSAGE,
    STT_CHANGE_TARGET_TRANS_LANGUAGE,
    STT_WS_SERVER_MESSAGE,
    STT_RETRY_CHECK,
    STT_RETRY_REQUEST,
    STT_RECORDER_MESSAGE,
    UPDATE_STT_MESSAGE,
    REMOVE_STT_MESSAGE,
    UPDATE_TRANS_MESSAGE,
    REMOVE_TRANS_MESSAGE,
    CHANGE_SUBTITLE_FONT_SIZE,
    ADD_STT_HISTORY,
    CHANGE_SUBTITLE_VISIBILITY
} from './actionTypes';

/**
 * Action that triggers toggle of the security options dialog.
 *
 * @returns {Function}
 */
export function openSTTDialog() {
    return function(dispatch: (Object) => Object) {
        dispatch(openDialog(STTDialog));
    };
}

export function toggleSTT(enabled: boolean, targetLanguage: string = undefined) {
    return {
        type: STT_TOGGLE_MESSAGE,
        enabled,
        targetLanguage
    };
}

export function changeSTTTargetLanguage(targetLanguage: string){
    return {
        type: STT_CHANGE_TARGET_LANGUAGE,
        targetLanguage
    }
}

export function toggleSTTTranslation(enabled: boolean, targetLanguage: string = undefined) {
    return {
        type: STT_TRANSLATION_TOGGLE_MESSAGE,
        enabled,
        targetLanguage
    };
}

export function changeSTTTargetTransLanguage(targetLanguage: string){
    return {
        type: STT_CHANGE_TARGET_TRANS_LANGUAGE,
        targetLanguage
    }
}

export function updateWSServer(wsSoc: Object, currentTargetLanguage: string) {
    return {
        type: STT_WS_SERVER_MESSAGE,
        wsSoc,
        currentTargetLanguage
    }
}

export function retryRequest () {
    return {
        type: STT_RETRY_REQUEST
    };
}

export function updateRetryCheck (retryCheck: boolean) {
    return {
        type: STT_RETRY_CHECK,
        retryCheck
    }
}

export function updateRecorder(recorder: Object) {
    return {
        type: STT_RECORDER_MESSAGE,
        recorder
    }
}

export function updateSTTMessage(sentenceId: string,
    newSTTMessage: Object) {
    return {
        type: UPDATE_STT_MESSAGE,
        sentenceId,
        newSTTMessage
    };
}

export function removeSTTMessage(sentenceId: string) {
    return {
        type: REMOVE_STT_MESSAGE,
        sentenceId
    };
}

export function updateTransMessage(sentenceId: string,
    newSTTMessage: Object) {
    return {
        type: UPDATE_TRANS_MESSAGE,
        sentenceId,
        newSTTMessage
    };
}

export function removeTransMessage(sentenceId: string) {
    return {
        type: REMOVE_TRANS_MESSAGE,
        sentenceId
    };
}

export function changeSubtitleFontSize(targetSize: string) {
    return {
        type: CHANGE_SUBTITLE_FONT_SIZE,
        targetSize
    };}

export function changeSubtitleVisibility(visible: boolean) {
    return {
        type: CHANGE_SUBTITLE_VISIBILITY,
        visible
    };}

export function addSTTMessageHistory(messageDetails: Object) {
    return {
        type: ADD_STT_HISTORY,
        ...messageDetails
    };}

    