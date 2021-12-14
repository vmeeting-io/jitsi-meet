// @flow
import axios from 'axios';
import { getAuthUrl } from '../../api/url';
import {setJWT} from '../base/jwt';
import tokenLocalStorage from '../../api/tokenLocalStorage';

import { setFollowMe, setStartMutedPolicy, setUserDeviceAccessDisabled } from '../base/conference';
import { hideDialog, openDialog } from '../base/dialog';
import { i18next } from '../base/i18n';
import { setAIAttentionSettings, updateSettings } from '../base/settings';
import { setPrejoinPageVisibility } from '../prejoin/actions';
import { PREJOIN_SCREEN_STATES } from '../prejoin/constants';
import { setScreenshareFramerate } from '../screen-share/actions';

import {
    SET_AUDIO_SETTINGS_VISIBILITY,
    SET_VIDEO_SETTINGS_VISIBILITY
} from './actionTypes';
import { LogoutDialog, SettingsDialog } from './components';
import { getMoreTabProps, getProfileTabProps, getSoundsTabProps } from './functions';
import { showNotification } from '../notifications';

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
                dispatch(setPrejoinPageVisibility(PREJOIN_SCREEN_STATES.HIDDEN));
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

        if (newState.currentFramerate !== currentState.currentFramerate) {
            const frameRate = parseInt(newState.currentFramerate, 10);

            dispatch(setScreenshareFramerate(frameRate));
        }

        if (newState.aiAttentionFlag !== currentState.aiAttentionFlag) {
            dispatch(updateSettings({
                aiAttentionAnalysisEnabled: newState.aiAttentionFlag
            }));
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
        const config = {
            headers: { Authorization: `Bearer ${tokenLocalStorage.getItem(getState())}`}
          };
        
        const _apiBase = getAuthUrl(getState());
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
                try {
                    axios.patch(`${_apiBase}/account`, { name: String(newState.displayName) }, config).then((resp) => {
                        const token = resp.data;
                        tokenLocalStorage.setItem(token, APP.store.getState());
                        dispatch(setJWT(resp.data));
                    });
                } catch(err) {
                    console.log(err);
                }

            }
    
            if (newState.email !== currentState.email) {
                APP.conference.changeLocalEmail(newState.email);
                try {
                    axios.patch(`${_apiBase}/account`, { email: String(newState.email) }, config).then((resp) => {
                        const token = resp.data;
                        tokenLocalStorage.setItem(token, APP.store.getState());
                        dispatch(setJWT(resp.data));
                    });
                } catch(err) {
                    console.log(err);
                }

            }
            
            // patching changes to the birthdate information
            if (newState.birthdate !== currentState.birthdate) {
                APP.conference.changeBirthDate(newState.birthdate)
                try {
                    axios.patch(`${_apiBase}/account`, { birthDate: String(newState.birthdate) }, config).then((resp) => {
                        const token = resp.data;
                        tokenLocalStorage.setItem(token, APP.store.getState());
                        // update the JWT token when birthday information is updated
                        dispatch(setJWT(resp.data));
                    });
                } catch(err) {
                    console.log(err);
                }
            }
            
            // previously hideDialog was called on every onSubmit Button, but here we check the above condition
            // and only dispatch hideDialog if there is a value set for profile name
            dispatch(hideDialog());
        }
    };
}

/**
 * Submits the settings from the "Sounds" tab of the settings dialog.
 *
 * @param {Object} newState - The new settings.
 * @returns {Function}
 */
export function submitSoundsTab(newState: Object): Function {
    return (dispatch, getState) => {
        const currentState = getSoundsTabProps(getState());
        const shouldUpdate = (newState.soundsIncomingMessage !== currentState.soundsIncomingMessage)
            || (newState.soundsParticipantJoined !== currentState.soundsParticipantJoined)
            || (newState.soundsParticipantLeft !== currentState.soundsParticipantLeft)
            || (newState.soundsTalkWhileMuted !== currentState.soundsTalkWhileMuted)
            || (newState.soundsReactions !== currentState.soundsReactions);

        if (shouldUpdate) {
            dispatch(updateSettings({
                soundsIncomingMessage: newState.soundsIncomingMessage,
                soundsParticipantJoined: newState.soundsParticipantJoined,
                soundsParticipantLeft: newState.soundsParticipantLeft,
                soundsTalkWhileMuted: newState.soundsTalkWhileMuted,
                soundsReactions: newState.soundsReactions
            }));
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
