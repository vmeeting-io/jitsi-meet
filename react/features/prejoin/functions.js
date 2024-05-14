// @flow

import { getRoomName } from '../base/conference/functions';
import { getDialOutStatusUrl, getDialOutUrl } from '../base/config/functions.any';
import {
    MEETING_NAME_ENABLED,
    UNSAFE_ROOM_WARNING
} from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';
import { isAudioMuted, isVideoMutedByUser } from '../base/media/functions';
import { getLobbyConfig } from '../lobby/functions';


/**
 * Selector for the visibility of the 'join by phone' button.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isJoinByPhoneButtonVisible(state: Object): boolean {
    return Boolean(getDialOutUrl(state) && getDialOutStatusUrl(state));
}

/**
 * Selector for determining if the device status strip is visible or not.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isDeviceStatusVisible(state: Object): boolean {
    return !(isAudioMuted(state) && isVideoMutedByUser(state))
    && !state['features/base/config'].startSilent;
}

/**
 * Selector for determining if the display name is mandatory.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isDisplayNameRequired(state: Object): boolean {
    return Boolean(state['features/lobby']?.isDisplayNameRequiredError
        || state['features/base/config']?.requireDisplayName);
}

/**
 * Selector for determining if the prejoin page is enabled in config. Defaults to `true`.
 *
 * @param {IReduxState} state - The state of the app.
 * @returns {boolean}
 */
export function isPrejoinEnabledInConfig(state: Object): boolean {
    return state['features/base/config'].prejoinConfig?.enabled ?? true;
}

/**
 * Selector for determining if the prejoin display name field is visible.
 *
 * @param {IReduxState} state - The state of the app.
 * @returns {boolean}
 */
export function isPrejoinDisplayNameVisible(state: Object): boolean {
    return !state['features/base/config'].prejoinConfig?.hideDisplayName;
}

/**
 * Returns the text for the prejoin status bar.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDeviceStatusText(state: Object): string {
    return state['features/prejoin']?.deviceStatusText;
}

/**
 * Returns the type of the prejoin status bar: 'ok'|'warning'.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDeviceStatusType(state: Object): string {
    return state['features/prejoin']?.deviceStatusType;
}

/**
 * Returns the 'conferenceUrl' used for dialing out.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDialOutConferenceUrl(state: Object): string {
    return `${getRoomName(state)}@${state['features/base/config'].hosts?.muc}`;
}

/**
 * Selector for getting the dial out country.
 *
 * @param {Object} state - The state of the app.
 * @returns {Object}
 */
export function getDialOutCountry(state: Object): Object {
    return state['features/prejoin'].dialOutCountry;
}

/**
 * Selector for getting the dial out number (without prefix).
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDialOutNumber(state: Object): string {
    return state['features/prejoin'].dialOutNumber;
}

/**
 * Selector for getting the dial out status while calling.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDialOutStatus(state: Object): string {
    return state['features/prejoin'].dialOutStatus;
}

/**
 * Returns the full dial out number (containing country code and +).
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getFullDialOutNumber(state: Object): string {
    const dialOutNumber = getDialOutNumber(state);
    const country = getDialOutCountry(state);

    return `+${country.dialCode}${dialOutNumber}`;
}

/**
 * Selector for getting the error if any while creating streams.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getRawError(state: Object): string {
    return state['features/prejoin']?.rawError;
}

/**
 * Selector for getting the visibility state for the 'JoinByPhoneDialog'.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isJoinByPhoneDialogVisible(state: Object): boolean {
    return state['features/prejoin']?.showJoinByPhoneDialog;
}

/**
 * Returns true if the prejoin page is enabled and no flag
 * to bypass showing the page is present.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isPrejoinPageVisible(state: Object): boolean {
    return Boolean(navigator.product !== 'ReactNative'
        && !state['features/base/config']?.iAmRecorder
        && isPrejoinEnabledInConfig(state)
        && state['features/prejoin']?.showPrejoin
        && !(state['features/base/config'].enableForcedReload && state['features/prejoin'].skipPrejoinOnReload));
}

/**
 * Returns true if we should auto-knock in case lobby is enabled for the room.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function shouldAutoKnock(state: Object): boolean {
    const { iAmRecorder, iAmSipGateway } = state['features/base/config'];
    const { userSelectedSkipPrejoin } = state['features/base/settings'];
    const { autoKnock } = getLobbyConfig(state);

    return Boolean(((isPrejoinEnabledInConfig(state) && !userSelectedSkipPrejoin)
            || autoKnock || (iAmRecorder && iAmSipGateway))
        && !state['features/lobby'].knocking);
}

/**
 * Returns true if the unsafe room warning flag is enabled.
 *
 * @param {IReduxState} state - The state of the app.
 * @returns {boolean}
 */
export function isUnsafeRoomWarningEnabled(state: Object): boolean {
    const { enableInsecureRoomNameWarning = false } = state['features/base/config'];

    return getFeatureFlag(state, UNSAFE_ROOM_WARNING, enableInsecureRoomNameWarning);
}

/**
 * Returns true if the room name is enabled.
 *
 * @param {IReduxState} state - The state of the app.
 * @returns {boolean}
 */
export function isRoomNameEnabled(state: Object): boolean {
    const { hideConferenceSubject = false } = state['features/base/config'];

    return getFeatureFlag(state, MEETING_NAME_ENABLED, true)
        || !hideConferenceSubject;
}
