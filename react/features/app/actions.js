/* eslint-disable camelcase */
// @flow

/* global interfaceConfig, process */

import { jitsiLocalStorage } from '@jitsi/js-utils';
import axios from 'axios';
import { has, omit, size } from 'lodash';
import qs from 'query-string';
import type { Dispatch } from 'redux';

import { API_ID } from '../../../modules/API/constants';
import tokenLocalStorage from '../../api/tokenLocalStorage';
import { sites } from '../../api';
import { getLocationURL, getAuthUrl } from '../../api/url';
import { loadCurrentUser } from '../base/auth';
import { setRoom, setSite } from '../base/conference';
import {
    configWillLoad,
    createFakeConfig,
    loadConfigError,
    restoreConfig,
    setConfig,
    storeConfig
} from '../base/config';
import { connect, disconnect, setLocationURL } from '../base/connection';
import { setJWT } from '../base/jwt';
import { browser, loadConfig } from '../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../base/media';
import { toState } from '../base/redux';
import { createDesiredLocalTracks, isLocalCameraTrackMuted, isLocalTrackMuted } from '../base/tracks';
import {
    addHashParamsToURL,
    getBackendSafeRoomName,
    getLocationContextRoot,
    parseURIString,
    toURLString
} from '../base/util';
import { isVpaasMeeting } from '../jaas/functions';
import { NOTIFICATION_TIMEOUT_TYPE, clearNotifications, saveErrorNotification, showNotification } from '../notifications';
import { setFatalError } from '../overlay';

import {
    getDefaultURL,
    getName
} from './functions';
import logger from './logger';

const LICENSE_ERROR_MAXED_LICENSE = 'maxed_license';
const LICENSE_ERROR_INVALID_LICENSE = 'invalid_license';
const LICENSE_ERROR_NOT_MODERATOR = 'not_moderator';
const LICENSE_ERROR_FORBIDDEN = 'forbidden';

// eslint-disable-next-line require-jsdoc
function getParams(uri: string) {
    const regex = /[?&]([^=#]+)=([^&#]*)/g;
    const params = {};
    let match;

    // eslint-disable-next-line no-cond-assign
    while (match = regex.exec(uri)) {
        params[match[1]] = match[2];
    }

    return params;
}

/**
 * Triggers an in-app navigation to a specific route. Allows navigation to be
 * abstracted between the mobile/React Native and Web/React applications.
 *
 * @param {string|undefined} uri - The URI to which to navigate. It may be a
 * full URL with an HTTP(S) scheme, a full or partial URI with the app-specific
 * scheme, or a mere room name.
 * @returns {Function}
 */
export function appNavigate(uri: ?string) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        let location = parseURIString(uri);
        const params = getParams(uri);

        console.log('appNavigate:', uri, params);

        // If the specified location (URI) does not identify a host, use the app's
        // default.
        if (!location || !location.host) {
            const defaultLocation = parseURIString(getDefaultURL(getState));

            if (location) {
                location.host = defaultLocation.host;

                // FIXME Turn location's host, hostname, and port properties into
                // setters in order to reduce the risks of inconsistent state.
                location.hostname = defaultLocation.hostname;
                location.pathname
                    = defaultLocation.pathname + location.pathname.substr(1);
                location.port = defaultLocation.port;
                location.protocol = defaultLocation.protocol;
            } else {
                location = defaultLocation;
            }
        }

        location.protocol || (location.protocol = 'https:');
        const { contextRoot, host, room, tenant } = location;
        const locationURL = new URL(location.toString());

        // Disconnect from any current conference.
        // FIXME: unify with web.
        if (browser.isReactNative()) {
            dispatch(disconnect());
        }

        // There are notifications now that gets displayed after we technically left
        // the conference, but we're still on the conference screen.
        dispatch(clearNotifications());

        dispatch(configWillLoad(locationURL, room));

        let protocol = location.protocol.toLowerCase();

        // The React Native app supports an app-specific scheme which is sure to not
        // be supported by fetch.
        protocol !== 'http:' && protocol !== 'https:' && (protocol = 'https:');

        const baseURL = `${protocol}//${host}${contextRoot || '/'}`;
        let url = `${baseURL}config.js`;

        // XXX In order to support multiple shards, tell the room to the deployment.
        room && (url += `?room=${getBackendSafeRoomName(room)}`);

        let config;

        // Avoid (re)loading the config when there is no room.
        if (!room) {
            config = restoreConfig(baseURL);
        }

        if (!config) {
            try {
                config = await loadConfig(url);

                // load data about room and do config setting here
                dispatch(storeConfig(baseURL, config));
            } catch (error) {
                config = restoreConfig(baseURL);

                if (!config) {
                    if (room) {
                        dispatch(loadConfigError(error, locationURL));

                        return;
                    }

                    // If there is no room (we are on the welcome page), don't fail, just create a fake one.
                    logger.warn('Failed to load config but there is no room, applying a fake one');
                    config = createFakeConfig(baseURL);
                }
            }
        }

        if (getState()['features/base/config'].locationURL !== locationURL) {
            dispatch(loadConfigError(new Error('Config no longer needed!'), locationURL));

            return;
        }

        dispatch(setLocationURL(locationURL));
        dispatch(setConfig(config));

        if (!room && navigator.product === 'ReactNative') {
            dispatch(setJWT());
        }

        const willAuthenticateURL = getLocationURL(getState());
        const apiBase = getAuthUrl(getState());
        if (locationURL && navigator.product === 'ReactNative') {
            dispatch(setJWT());
            const savedToken = tokenLocalStorage.getItemByURL(willAuthenticateURL);
            if (savedToken) {
                dispatch(setJWT(savedToken));
            } else if (params.token && tokenLocalStorage.validateToken(null, params.token)) {
                tokenLocalStorage.setItemByURL(willAuthenticateURL, params.token);
                dispatch(setJWT(params.token));
            }
        } else if (params.token && tokenLocalStorage.validateToken(null, params.token)) {
            dispatch(setJWT(params.token));
        } else {
            // Load current logged in user
            dispatch(loadCurrentUser());
        }

        let { site } = getState()['features/base/conference'];
        const { iAmRecorder, iAmSipGateway } = getState()['features/base/config'];
        if (!iAmRecorder && !iAmSipGateway && !site) {
            const resp = await sites().siteId(tenant).get();
            site = resp.data.docs[0];
            dispatch(setSite(site));
        }
        // console.log('conference.site:', site);

        const pathname = locationURL.pathname;
        const { sso_key: ssoKey } = site;
        const ssoValue = params[ssoKey];
        if (pathname === '/' && ssoKey) {
            const args = omit(qs.parse(locationURL.search), [ssoKey]);
            locationURL.search = size(args) > 0 ? `?${qs.stringify(args)}` : '';
            dispatch(setLocationURL(locationURL));
        }

        // 새로운 사용자에 대한 SSO 로그인을 수행하기 위해
        // 전달된 ssoValue가 저장된 ssoValue와 다르면 인증키를 저장하고 로그아웃 한다.
        if (ssoValue && jitsiLocalStorage.getItem(ssoKey) !== ssoValue) {
            jitsiLocalStorage.setItem(ssoKey, ssoValue);
            dispatch(setJWT());

            if (tokenLocalStorage.getItem(getState())) {
                axios.get(`${apiBase}/logout`).then(() => {
                    // dispatch(setCurrentUser());
                    tokenLocalStorage.removeItem(getState());
                });
            }
        }

        let roomInfo;
        const { tenant: userTenant, user, jwt } = getState()['features/base/jwt'];
        const pattern = /\/(?<site_id>[^\/]+)\/(?<conf_name>[^\/]+)$/;
        const matched = pathname.match(pattern);
        if (!user && matched && ssoValue) {
            try {
                let { partnerCode, ...options } = params;

                // 인증이 완료된 후에 다시 현재 URL로 이동하기 위해.
                options.next = pathname;

                // partnerCode가 없는 경우 site_id와 동일한 값을 사용한다.
                if (!partnerCode) {
                    partnerCode = matched.groups?.site_id;
                }

                // apiToken이 없으면 서버에 저장된 토큰을 이용한다.
                if (!options.apiToken) {
                    options.apiToken = 'fake-token';
                }

                // 사용자가 없으면 일단 토큰을 발급받으러 간다.
                // 원래는 파트너가 제공하는 로그인 페이지로 가야 하지만 제공하는 경우에만 이동하고
                // 그렇지 않고 직접 방으로 접속하는 경우에는 자동 SSO 로그인을 위해 SSO 완료 URL로 이동한다.
                window.location.href = `${apiBase}/complete/${partnerCode}?${qs.stringify(options)}`;
                return;
            } catch (err) {
                console.error('Failed to get token:', err);
            }
        }

        // 방 접속 전에 한번 더 불리는 것을 방지하기 위해서 pathname 체크.
        if (room &&
            pathname !== '/' &&
            (browser.isReactNative() || window.location.pathname === pathname) &&
            (!has(params, 'host') || params.host === 'true')
        ) {
            let apiUrl;
            let resp;

            if (tenant) {
                apiUrl = `${apiBase}/sites/${tenant}/conferences`;
            } else if (!userTenant) {
                apiUrl = `${apiBase}/conferences`;
            } else {
                dispatch(appNavigate(`${protocol}//${host}/${userTenant}/${room}`));
                return;
            }

            if (ssoValue) {
                apiUrl += `?${ssoKey}=${ssoValue}`;
            } else if (navigator.product === 'ReactNative') {
                delete params.token;
                const query = qs.stringify(params);
                if (query) {
                    apiUrl += `?${query}`;
                }
            }

            try {
                const headers = jwt ? { Authorization: `Bearer ${jwt}` } : {};
                resp = await axios.post(apiUrl, {
                    name: getBackendSafeRoomName(room),
                    start_time: new Date(),
                }, { headers });
                roomInfo = resp.data.conference;
                roomInfo.isHost = user && roomInfo?.mail_owner === user?.email;
            } catch (err) {
                console.log('Request is failed.', err.response);
                const { error, conference } = err.response?.data || {};

                switch (error) {
                    case LICENSE_ERROR_INVALID_LICENSE:
                    case LICENSE_ERROR_MAXED_LICENSE: {
                        const messages = {
                            [LICENSE_ERROR_INVALID_LICENSE]: 'dialog.InvalidLicense',
                            [LICENSE_ERROR_MAXED_LICENSE]: 'dialog.MaxedLicense',
                        };
                        
                        dispatch(saveErrorNotification({
                            titleKey: 'dialog.LicenseError',
                            descriptionKey: messages[error],
                        }));
                        dispatch(redirectWithStoredParams('/'));
                        return;
                    }
                    default: {
                        roomInfo = conference;
                        if (roomInfo) {
                            roomInfo.isHost = user && roomInfo.mail_owner === user?.email;
                        }
                    }
                }
            }
        }

        dispatch(setRoom(room, roomInfo));

        // FIXME: unify with web, currently the connection and track creation happens in conference.js.
        if (room && navigator.product === 'ReactNative') {
            dispatch(createDesiredLocalTracks());
            dispatch(connect());
        }
    };
}

/**
 * Redirects to another page generated by replacing the path in the original URL
 * with the given path.
 *
 * @param {(string)} pathname - The path to navigate to.
 * @returns {Function}
 */
export function redirectWithStoredParams(pathname: string) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const { locationURL } = getState()['features/base/connection'];
        const newLocationURL = new URL(locationURL.href);

        newLocationURL.pathname = pathname;

        if (newLocationURL.search) {
            let search = qs.parse(newLocationURL.search);
            delete search.token;
            newLocationURL.search = `?${qs.stringify(search)}`;
        }

        window.location.assign(newLocationURL.toString());
    };
}

/**
 * Assigns a specific pathname to window.location.pathname taking into account
 * the context root of the Web app.
 *
 * @param {string} pathname - The pathname to assign to
 * window.location.pathname. If the specified pathname is relative, the context
 * root of the Web app will be prepended to the specified pathname before
 * assigning it to window.location.pathname.
 * @param {string} hashParam - Optional hash param to assign to
 * window.location.hash.
 * @returns {Function}
 */
export function redirectToStaticPage(pathname: string, hashParam: ?string) {
    return () => {
        const windowLocation = window.location;
        let newPathname = pathname;

        if (!newPathname.startsWith('/')) {
            // A pathname equal to ./ specifies the current directory. It will be
            // fine but pointless to include it because contextRoot is the current
            // directory.
            newPathname.startsWith('./')
                && (newPathname = newPathname.substring(2));
            newPathname = getLocationContextRoot(windowLocation) + newPathname;
        }

        if (hashParam) {
            windowLocation.hash = hashParam;
        }

        windowLocation.pathname = newPathname;
    };
}

/**
 * Reloads the page.
 *
 * @protected
 * @returns {Function}
 */
export function reloadNow() {
    return (dispatch: Dispatch<Function>, getState: Function) => {
        dispatch(setFatalError(undefined));

        const state = getState();
        const { locationURL } = state['features/base/connection'];

        // Preserve the local tracks muted state after the reload.
        const newURL = addTrackStateToURL(locationURL._url ? locationURL._url : locationURL, state);

        logger.info(`Reloading the conference using URL: ${locationURL}`);

        if (navigator.product === 'ReactNative') {
            dispatch(appNavigate(toURLString(newURL)));
        } else {
            dispatch(reloadWithStoredParams());
        }
    };
}

/**
 * Adds the current track state to the passed URL.
 *
 * @param {URL} url - The URL that will be modified.
 * @param {Function|Object} stateful - The redux store or {@code getState} function.
 * @returns {URL} - Returns the modified URL.
 */
function addTrackStateToURL(url, stateful) {
    const state = toState(stateful);
    const tracks = state['features/base/tracks'];
    const isVideoMuted = isLocalCameraTrackMuted(tracks);
    const isAudioMuted = isLocalTrackMuted(tracks, MEDIA_TYPE.AUDIO);

    return addHashParamsToURL(new URL(url), { // use new URL object in order to not pollute the passed parameter.
        'config.startWithAudioMuted': isAudioMuted,
        'config.startWithVideoMuted': isVideoMuted
    });

}

/**
 * Reloads the page by restoring the original URL.
 *
 * @returns {Function}
 */
export function reloadWithStoredParams() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const { locationURL } = state['features/base/connection'];

        // Preserve the local tracks muted states.
        const newURL = addTrackStateToURL(locationURL, state);
        const windowLocation = window.location;
        const oldSearchString = windowLocation.search;

        windowLocation.replace(newURL.toString());

        if (newURL.search === oldSearchString) {
            // NOTE: Assuming that only the hash or search part of the URL will
            // be changed!
            // location.replace will not trigger redirect/reload when
            // only the hash params are changed. That's why we need to call
            // reload in addition to replace.
            windowLocation.reload();
        }
    };
}

/**
 * Check if the welcome page is enabled and redirects to it.
 * If requested show a thank you dialog before that.
 * If we have a close page enabled, redirect to it without
 * showing any other dialog.
 *
 * @param {Object} options - Used to decide which particular close page to show
 * or if close page is disabled, whether we should show the thankyou dialog.
 * @param {boolean} options.showThankYou - Whether we should
 * show thank you dialog.
 * @param {boolean} options.feedbackSubmitted - Whether feedback was submitted.
 * @returns {Function}
 */
export function maybeRedirectToWelcomePage(options: Object = {}) {
    return (dispatch: Dispatch<any>, getState: Function) => {

        const {
            enableClosePage
        } = getState()['features/base/config'];

        // if close page is enabled redirect to it, without further action
        if (enableClosePage) {
            if (isVpaasMeeting(getState())) {
                redirectToStaticPage('/');
                return;
            }

            const { jwt } = getState()['features/base/jwt'];
            let hashParam;

            // save whether current user is guest or not, and pass auth token,
            // before navigating to close page
            window.sessionStorage.setItem('guest', !jwt);
            window.sessionStorage.setItem('jwt', jwt);

            let path = 'close.html';

            if (interfaceConfig.SHOW_PROMOTIONAL_CLOSE_PAGE) {
                if (Number(API_ID) === API_ID) {
                    hashParam = `#jitsi_meet_external_api_id=${API_ID}`;
                }
                path = 'close3.html';
            } else if (!options.feedbackSubmitted) {
                path = 'close2.html';
            }

            dispatch(redirectToStaticPage(`static/${path}`, hashParam));

            return;
        }

        // else: show thankYou dialog only if there is no feedback
        if (options.showThankYou) {
            dispatch(showNotification({
                titleArguments: { appName: getName() },
                titleKey: 'dialog.thankYou'
            }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
        }

        // if Welcome page is enabled redirect to welcome page after 3 sec, if
        // there is a thank you message to be shown, 0.5s otherwise.
        if (getState()['features/base/config'].enableWelcomePage) {
            setTimeout(
                () => {
                    dispatch(redirectWithStoredParams('/'));
                },
                options.showThankYou ? 3000 : 500);
        }
    };
}
