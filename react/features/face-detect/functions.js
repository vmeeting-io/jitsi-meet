// @flow

import axios from 'axios';
import { getAuthUrl } from '../../api/url';

export async function grantFaceDetect(state) {
    const apiBase = getAuthUrl(state);

    try {
        const { jwt } = state['features/base/jwt'];
        const headers = jwt ? { Authorization: `Bearer ${jwt}` } : {};
        const resp = await axios.get(`${apiBase}/check-face-detect`, { headers });
        console.log('grantFaceDetect:', resp.data);
        return resp.data?.result;
    } catch (err) {
        console.error('grantFaceDetect is failed.', err);
    }
    
    return false;
}

export function getAttentionAnalysisWindow(state) {
    const { childWindow } = state['features/face-detect'];

    return (childWindow && !childWindow.closed)
        ? childWindow : null;
}

export function isAttentionAnalysisEnabled(state) {
    const { face_detect } = state['features/base/conference'].roomInfo || {};

    return Boolean(face_detect);
}

export function getAttentionAnalysisReady(state) {
    const { ready } = state['features/face-detect'];
    return ready;
}

export function getFaceDetector(state) {
    const { instance } = state['features/face-detect'];
    return instance;
}
