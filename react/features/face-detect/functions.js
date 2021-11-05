// @flow

import axios from 'axios';

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