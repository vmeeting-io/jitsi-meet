/* eslint-disable no-param-reassign */
/* eslint-disable require-jsdoc */
import { jitsiLocalStorage } from '@jitsi/js-utils';
import jwtDecode from 'jwt-decode';

import { getAuthServerURL } from './url';

const DEFAULT_TOKEN_VERSION = "2";
const JWT_TOKEN_VERSION = navigator.product === 'ReactNative'
    ? DEFAULT_TOKEN_VERSION
    : window._env_.JWT_TOKEN_VERSION;

class TokenLocalStorage {
    validateToken(url, token) {
        try {
            if (url && url[url.length - 1] === '/') {
                url = url.substring(0, url.length - 1);
            }
    
            const storedToken = token || jitsiLocalStorage.getItem(`token/${url}`);
            if (storedToken) {
                const { exp, context } = jwtDecode(storedToken);
        
                // 유효한 토큰인 경우만 token을 리턴한다.
                if (Date.now() < exp * 1000 && context.tv === JWT_TOKEN_VERSION) {
                    return storedToken;
                }
    
                if (url) {
                    this.removeItemByURL(url);
                }
            }
        } catch(err) {
            console.error('validateToken is failed:', err);
        }
    
        return null;
    }
    
    getItem(stateful) {
        const url = getAuthServerURL(stateful);
        return this.validateToken(url);
    }

    getItemByURL(url) {
        return this.validateToken(url);
    }

    setItem(token, stateful) {
        const url = getAuthServerURL(stateful);

        jitsiLocalStorage.setItem(`token/${url}`, token);
    }

    setItemByURL(url, token) {
        if (url[url.length - 1] === '/') {
            url = url.substring(0, url.length - 1);
        }

        return jitsiLocalStorage.setItem(`token/${url}`, token);
    }

    removeItem(stateful) {
        const url = getAuthServerURL(stateful);

        jitsiLocalStorage.removeItem(`token/${url}`);
    }

    removeItemByURL(url) {
        if (url[url.length - 1] === '/') {
            url = url.substring(0, url.length - 1);
        }

        return jitsiLocalStorage.removeItem(`token/${url}`);
    }
}

const tokenLocalStorage = new TokenLocalStorage();

export default tokenLocalStorage;