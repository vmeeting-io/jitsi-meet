// @flow

import React from 'react';
import { Helmet } from 'react-helmet';

import { TOOLBAR_BUTTONS } from './constants';

export * from './functions.any';

/**
 * Removes all analytics related options from the given configuration, in case of a libre build.
 *
 * @param {*} config - The configuration which needs to be cleaned up.
 * @returns {void}
 */
export function _cleanupConfig(config: Object) { // eslint-disable-line no-unused-vars
}

/**
 * Returns the dial out url.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDialOutStatusUrl(state: Object): string {
    return state['features/base/config'].guestDialOutStatusUrl;
}

/**
 * Returns the dial out status url.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDialOutUrl(state: Object): string {
    return state['features/base/config'].guestDialOutUrl;
}

/**
 * Returns the replaceParticipant config.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function getReplaceParticipant(state: Object): string {
    return state['features/base/config'].replaceParticipant;
}

/**
 * Returns the list of enabled toolbar buttons.
 *
 * @param {Object} state - The redux state.
 * @returns {Array<string>} - The list of enabled toolbar buttons.
 */
export function getToolbarButtons(state: Object): Array<string> {
    const { toolbarButtons } = state['features/base/config'];

    return Array.isArray(toolbarButtons) ? toolbarButtons : TOOLBAR_BUTTONS;
}

/**
 * Checks if the specified button is enabled.
 *
 * @param {string} buttonName - The name of the button.
 * {@link interfaceConfig}.
 * @param {Object|Array<string>} state - The redux state or the array with the enabled buttons.
 * @returns {boolean} - True if the button is enabled and false otherwise.
 */
export function isToolbarButtonEnabled(buttonName: string, state: Object | Array<string>) {
    const buttons = Array.isArray(state) ? state : getToolbarButtons(state);

    return buttons.includes(buttonName);
}

export function getCustomBranding(state: Object) {
    const { customBranding } = state['features/base/config'] || {};

    if (customBranding) {
        const { title, description, keywords, thumb, favicon } = customBranding;

        return (
            <Helmet>
                {title && <title>{title}</title>}
                {description && <meta name="description" content={description} />}
                {keywords && <meta name="keywords" content={keywords} />}
                {title && <meta name="og:title" content={title} />}
                {thumb && <meta name="og:image" content={thumb} />}
                {description && <meta name="og:description" content={description} />}
                {description && <meta description={description} />}
                {title && <meta itemprop="name" content={title} />}
                {description && <meta itemprop="description" content={description} />}
                {thumb && <meta itemprop="image" content={thumb} />}
                {favicon && <link rel="apple-touch-icon" type="image/png" href={favicon} />}
                {favicon && <link rel="icon" type="image/png" href={favicon} />}
            </Helmet>
        )
    } else {
        return null;
    }
}
