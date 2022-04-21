// @flow

import axios from 'axios';
import type { Dispatch } from 'redux';

import { toggleDialog } from '../base/dialog';
import { SecurityDialog } from './components/security-dialog';

import {
    SET_PUBLIC_SCOPE_ENABLED
} from './actionTypes';

/**
 * Action that triggers toggle of the security options dialog.
 *
 * @returns {Function}
 */
export function toggleSecurityDialog() {
    return function(dispatch: (Object) => Object) {
        dispatch(toggleDialog(SecurityDialog));
    };
}

export function toggleScope() {
    return function(dispatch: Dispatch<any>, getState: Function) {
        const room = getState()['features/base/conference'].roomInfo;

        if (room) {
            const baseURL = getState()['features/base/connection'].locationURL;

            const AUTH_API_BASE = window._env_.VMEETING_API_BASE;
            const apiBaseUrl = `${baseURL.origin}${AUTH_API_BASE}`;

            try {
                axios.patch(`${apiBaseUrl}/conferences/${room._id}`, {
                    scope: !room.scope
                }).then(conf => {
                    dispatch(setPublicScopeEnabled(!room.scope));
                });
            } catch(err) {    
                console.log(err);
            }
        }
    };
}

/**
 * Dispatches an action to set scope.
 *
 * @param {boolean} enabled - The new value to set scope.
 * @returns {{
 *      type: SET_PUBLIC_SCOPE_ENABLED,
 *      enabled: boolean
 * }}
 */
export function setPublicScopeEnabled(enabled: boolean) {
    return {
        type: SET_PUBLIC_SCOPE_ENABLED,
        enabled
    };
}
