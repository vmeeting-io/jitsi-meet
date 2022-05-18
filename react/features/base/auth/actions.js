import { jitsiLocalStorage } from '@jitsi/js-utils';

import tokenLocalStorage from '../../../api/tokenLocalStorage';
import { users } from '../../../api/users';
import { setJWT } from '../jwt';

import { SET_CURRENT_USER } from './actionTypes';

/**
 * Load current logged in user.
 *
 * @returns {Function}
 */
export function loadCurrentUser() {
    return async (dispatch, getState) => {
        try {
            const token = tokenLocalStorage.getItem(getState());
            if (token) {
                jitsiLocalStorage.removeItem('background');
                dispatch(setJWT(token));

                // reload from rest api
                const resp = await users(token).me();
                // console.log('loadCurrentUser:', resp.data);
                dispatch(setJWT(resp.data));
            }
        } catch (e) {
            console.error('loadCurrentUser is failed:', e.message);
        }
    };
}

/**
 * Set user information.
 *
 * @param {Object} user - The user's information.
 * @returns {{
 *     type: SET_CURRENT_USER,
 * }}
 */
export function setCurrentUser(user) {
    return {
        type: SET_CURRENT_USER,
        user
    };
}
