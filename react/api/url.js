/* eslint-disable require-jsdoc */
import { toState } from '../features/base/redux/functions';
import { getServerURL } from '../features/base/settings/functions';

export function getAuthServerURL(stateful) {
    const state = toState(stateful);
    const serverUrl = getServerURL(state);

    return serverUrl;
}

export function getLocationURL(stateful) {
    const state = toState(stateful);
    const { _host, host } = state['features/base/connection'].locationURL;

    return `https://${_host || host}`;
}

export function getAuthUrl(stateful) {
    if (navigator.product === 'ReactNative') {
        const baseUrl = getLocationURL(stateful);
        return `${baseUrl}/auth/api`;
    }

    return window._env_.VMEETING_API_BASE;
}
