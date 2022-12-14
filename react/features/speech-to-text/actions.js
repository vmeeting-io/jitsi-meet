// @flow
import { openDialog } from '../base/dialog';
import { STTDialog } from './components/stt-dialog';

import { 
    STT_TOGGLE_MESSAGE,
    STT_TRANSLATION_TOGGLE_MESSAGE,
    STT_MINUTES_TOGGLE_MESSAGE,
    STT_WS_SERVER_MESSAGE,
    STT_RECORDER_MESSAGE,
    UPDATE_STT_MESSAGE,
    REMOVE_STT_MESSAGE
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

export function toggleSTT(enabled: boolean) {
    return {
        type: STT_TOGGLE_MESSAGE,
        enabled
    };
}

export function toggleSTTTranslation(enabled: boolean) {
    return {
        type: STT_TRANSLATION_TOGGLE_MESSAGE,
        enabled
    };
}

export function toggleSTTMinutes(enabled: boolean) {
    return {
        type: STT_MINUTES_TOGGLE_MESSAGE,
        enabled
    };
}

export function updateWSServer(wsSoc: Object) {
    return {
        type: STT_WS_SERVER_MESSAGE,
        wsSoc
    }
}

export function updateRecorder(recorder: Object) {
    return {
        type: STT_RECORDER_MESSAGE,
        recorder
    }
}

export function updateSTTMessage(participantId: string,
    newSTTMessage: Object) {
    return {
        type: UPDATE_STT_MESSAGE,
        participantId,
        newSTTMessage
    };
}

export function removeSTTMessage(participantId: string) {
    return {
        type: REMOVE_STT_MESSAGE,
        participantId
    };
}