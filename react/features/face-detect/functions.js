// @flow

export function getAttentionAnalysisWindow(state) {
    const { childWindow } = state['features/face-detect'];

    return (childWindow && !childWindow.closed)
        ? childWindow : null;
}

export function isAttentionAnalysisEnabled(state) {
    const { face_detect } = state['features/base/conference'].roomInfo || {};
    const { iAmRecorder } = state['features/base/config'];

    return Boolean(!iAmRecorder && face_detect);
}

export function getAttentionAnalysisReady(state) {
    const { ready } = state['features/face-detect'];
    return ready;
}

export function getFaceDetector(state) {
    const { instance } = state['features/face-detect'];
    return instance;
}

export function getStatusMap(state) {
    return state['features/face-detect'].statusMap;
}
