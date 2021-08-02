// @flow

import { setFollowMe, setStartMutedPolicy, setUserDeviceAccessDisabled } from '../base/conference';
import { hideDialog, openDialog } from '../base/dialog';
import { i18next } from '../base/i18n';
import { updateSettings } from '../base/settings';
import { setPrejoinPageVisibility } from '../prejoin/actions';

import {
    SET_AUDIO_SETTINGS_VISIBILITY,
    SET_VIDEO_SETTINGS_VISIBILITY
} from './actionTypes';
import { LogoutDialog, SettingsDialog } from './components';
import { getMoreTabProps, getProfileTabProps } from './functions';

declare var APP: Object;

const NOTIFICATION_TIMEOUT = 3000;

/**
 * Opens {@code LogoutDialog}.
 *
 * @param {Function} onLogout - The event in {@code LogoutDialog} that should be
 *  enabled on click.
 * @returns {Function}
 */
export function openLogoutDialog(onLogout: Function) {
    return openDialog(LogoutDialog, { onLogout });
}

/**
 * Opens {@code SettingsDialog}.
 *
 * @param {string} defaultTab - The tab in {@code SettingsDialog} that should be
 * displayed initially.
 * @returns {Function}
 */
export function openSettingsDialog(defaultTab: string) {
    return openDialog(SettingsDialog, { defaultTab });
}

/**
 * Sets the visibility of the audio settings.
 *
 * @param {boolean} value - The new value.
 * @returns {Function}
 */
function setAudioSettingsVisibility(value: boolean) {
    return {
        type: SET_AUDIO_SETTINGS_VISIBILITY,
        value
    };
}

/**
 * Sets the visibility of the video settings.
 *
 * @param {boolean} value - The new value.
 * @returns {Function}
 */
function setVideoSettingsVisibility(value: boolean) {
    return {
        type: SET_VIDEO_SETTINGS_VISIBILITY,
        value
    };
}

/**
 * Submits the settings from the "More" tab of the settings dialog.
 *
 * @param {Object} newState - The new settings.
 * @returns {Function}
 */
export function submitMoreTab(newState: Object): Function {
    return (dispatch, getState) => {
        const currentState = getMoreTabProps(getState());

        if (newState.followMeEnabled !== currentState.followMeEnabled) {
            dispatch(setFollowMe(newState.followMeEnabled));
        }

        const showPrejoinPage = newState.showPrejoinPage;

        if (showPrejoinPage !== currentState.showPrejoinPage) {
            // The 'showPrejoin' flag starts as 'true' on every new session.
            // This prevents displaying the prejoin page when the user re-enables it.
            if (showPrejoinPage && getState()['features/prejoin']?.showPrejoin) {
                dispatch(setPrejoinPageVisibility(false));
            }
            dispatch(updateSettings({
                userSelectedSkipPrejoin: !showPrejoinPage
            }));
        }

        if (newState.startAudioMuted !== currentState.startAudioMuted
            || newState.startVideoMuted !== currentState.startVideoMuted) {
            dispatch(setStartMutedPolicy(
                newState.startAudioMuted, newState.startVideoMuted));
        }

        if (newState.userDeviceAccessDisabled !== currentState.userDeviceAccessDisabled) {
            dispatch(setUserDeviceAccessDisabled(newState.userDeviceAccessDisabled));
        }
        // end of added portion

        if (newState.currentLanguage !== currentState.currentLanguage) {
            i18next.changeLanguage(newState.currentLanguage);
        }
    };
}

/**
 * Submits the settings from the "Profile" tab of the settings dialog.
 *
 * @param {Object} newState - The new settings.
 * @returns {Function}
 */
export function submitProfileTab(newState: Object): Function {
    return (dispatch, getState) => {
        const currentState = getProfileTabProps(getState());

        // check if there is a value for displayName i.e. participant's name
        // if it is not set, show a toast message
        if(newState.displayName === "" || newState.displayName === undefined || newState.displayName.trim() === "") {
            dispatch(showNotification({
                titleKey: 'notify.noNameInsertedInProfileTab'
            }));
        }

        // else, proceed to updating profile information
        else {
            if (newState.displayName !== currentState.displayName) {
                APP.conference.changeLocalDisplayName(newState.displayName);
            }
    
            if (newState.email !== currentState.email) {
                APP.conference.changeLocalEmail(newState.email);
            }
            
            // previously hideDialog was called on every onSubmit Button, but here we check the above condition
            // and only dispatch hideDialog if there is a value set for profile name
            dispatch(hideDialog());
        }
    };
}

/**
 * Toggles the visibility of the audio settings.
 *
 * @returns {void}
 */
export function toggleAudioSettings() {
    return (dispatch: Function, getState: Function) => {
        const value = getState()['features/settings'].audioSettingsVisible;

        dispatch(setAudioSettingsVisibility(!value));
    };
}

/**
 * Toggles the visibility of the video settings.
 *
 * @returns {void}
 */
export function toggleVideoSettings() {
    return (dispatch: Function, getState: Function) => {
        const value = getState()['features/settings'].videoSettingsVisible;

        dispatch(setVideoSettingsVisibility(!value));
    };
}
