// @flow

/* global interfaceConfig, process */

import { jitsiLocalStorage } from '@jitsi/js-utils';
import axios from 'axios';
import { has, omit, size } from 'lodash';
import qs from 'query-string';
import type { Dispatch } from 'redux';

import { API_ID } from '../../../modules/API/constants';
import tokenLocalStorage from '../../api/tokenLocalStorage';
import { getLocationURL, getAuthUrl } from '../../api/url';
import { loadCurrentUser } from '../base/auth';
import { setRoom } from '../base/conference';
import { navigateRoot } from '../mobile/navigation/rootNavigationContainerRef';
import {
    configWillLoad,
    createFakeConfig,
    loadConfigError,
    restoreConfig,
    setConfig,
    storeConfig
} from '../base/config';
import { connect, disconnect, setLocationURL } from '../base/connection';
import { loadConfig } from '../base/lib-jitsi-meet/functions.native';
import { setJWT } from '../base/jwt';
import { browser } from '../base/lib-jitsi-meet';
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
import { screen } from '../mobile/navigation/routes';
import { isVpaasMeeting } from '../jaas/functions';
import { NOTIFICATION_TIMEOUT_TYPE, clearNotifications, saveErrorNotification, showNotification } from '../notifications';
import { setFatalError } from '../overlay';

import {
    getDefaultURL,
    getName
} from './functions';

import { addTrackStateToURL } from './functions.native';
import logger from './logger';

export * from './actions.any';

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
    logger.info(`appNavigate to ${uri}`);

    return async (dispatch: Dispatch<any>, getState: Function) => {
        let location = parseURIString(uri);
        const params = getParams(uri);

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

        if (room) {
            navigateRoot(screen.connecting);
        }

        dispatch(disconnect());

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

        if (!room) {
            dispatch(setJWT());
        }

        const willAuthenticateURL = getLocationURL(getState());
        if (locationURL) {
            dispatch(setJWT());
            const savedToken = tokenLocalStorage.getItemByURL(willAuthenticateURL);
            if (savedToken) {
                dispatch(setJWT(savedToken));
            } else if (params.token && tokenLocalStorage.validateToken(null, params.token)) {
                tokenLocalStorage.setItemByURL(willAuthenticateURL, params.token);
                dispatch(setJWT(params.token));
            }
        }

        dispatch(setRoom(room));

        if (room) {
            dispatch(createDesiredLocalTracks());
            dispatch(connect());
        }
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
        const newURL = addTrackStateToURL(locationURL, state);

        logger.info(`Reloading the conference using URL: ${locationURL}`);
        
        dispatch(appNavigate(toURLString(newURL)));
    };
}
