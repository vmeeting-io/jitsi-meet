import { iAmVisitor } from '../../visitors/functions';
import CONFIG_WHITELIST from '../config/configWhitelist';
import { toState } from '../redux/functions';
import { parseURLParams } from '../util/parseURLParams';

import { DEFAULT_SERVER_URL } from './constants';

/**
 * Returns the effective value of a configuration/preference/setting by applying
 * a precedence among the values specified by JWT, URL, settings,
 * and config.
 *
 * @param {Object|Function} stateful - The redux state object or {@code getState} function.
 * @param {string} propertyName - The name of the
 * configuration/preference/setting (property) to retrieve.
 * @param {Object} sources - Flags indicating the configuration/preference/setting sources to
 * consider/retrieve values from.
 * @param {boolean} sources.config - Config.
 * @param {boolean} jwt - JWT.
 * @param {boolean} settings - Settings.
 * @param {boolean} urlParams - URL parameters.
 * @returns {any}
 */
export function getPropertyValue(
        stateful,
        propertyName,
        sources
) {
    // Default values don't play nicely with partial objects and we want to make
    // the function easy to use without exhaustively defining all flags:
    sources = { // eslint-disable-line no-param-reassign
        // Defaults:
        config: true,
        jwt: true,
        settings: true,
        urlParams: true,

        ...sources
    };

    // Precedence: jwt -> urlParams -> settings -> config.

    const state = toState(stateful);

    // jwt
    if (sources.jwt) {
        const value = state['features/base/jwt'][propertyName];

        if (typeof value !== 'undefined') {
            return value[propertyName];
        }
    }

    // urlParams
    if (sources.urlParams) {
        if (CONFIG_WHITELIST.indexOf(propertyName) !== -1) {
            const urlParams
                = parseURLParams(state['features/base/connection'].locationURL ?? '');
            const value = urlParams[`config.${propertyName}`];

            if (typeof value !== 'undefined') {
                return value;
            }
        }
    }

    // settings
    if (sources.settings) {
        const value = state['features/base/settings'][propertyName];

        if (typeof value !== 'undefined') {
            return value;
        }
    }

    // config
    if (sources.config) {
        const value = state['features/base/config'][propertyName];

        if (typeof value !== 'undefined') {
            return value;
        }
    }

    return undefined;
}

/**
 * Gets the currently configured server URL.
 *
 * @param {Object|Function} stateful - The redux state object or
 * {@code getState} function.
 * @returns {string} - The currently configured server URL.
 */
export function getServerURL(stateful) {
    const state = toState(stateful);

    return state['features/base/settings'].serverURL || DEFAULT_SERVER_URL;
}

/**
 * Should we hide the helper dialog when a user tries to do audio only screen sharing.
 *
 * @param {Object} state - The state of the application.
 * @returns {boolean}
 */
export function shouldHideShareAudioHelper(state) {

    return state['features/base/settings'].hideShareAudioHelper;
}

/**
 * Gets the disabled self view setting.
 *
 * @param {Object} state - Redux state.
 * @returns {boolean}
 */
export function getHideSelfView(state) {
    return state['features/base/config'].disableSelfView || state['features/base/settings'].disableSelfView
        || iAmVisitor(state);
}
