// @flow
import axios from 'axios';
import { batch } from 'react-redux';

import { getAuthUrl } from '../../api/url';
import { conferences } from '../../api/conferences';
import tokenLocalStorage from '../../api/tokenLocalStorage';
import { setTokenAuthUrlSuccess } from '../authentication/actions.web';
import { isTokenAuthEnabled } from '../authentication/functions';
import {
    setFollowMe,
    setRoomInfo,
    setStartMutedPolicy,
    setStartReactionsMuted
} from '../base/conference/actions';
import { hangup } from '../base/connection/actions.web';
import { openDialog } from '../base/dialog/actions';
import i18next from '../base/i18n/i18next';
import { setJWT } from '../base/jwt/actions';
import { browser } from '../base/lib-jitsi-meet';
import { updateSettings } from '../base/settings/actions';
import { getLocalVideoTrack } from '../base/tracks/functions.web';
import { appendURLHashParam } from '../base/util/uri';
import { disableKeyboardShortcuts, enableKeyboardShortcuts } from '../keyboard-shortcuts/actions.web';
import { toggleBackgroundEffect } from '../virtual-background/actions';
import virtualBackgroundLogger from '../virtual-background/logger';

import {
    SET_AUDIO_SETTINGS_VISIBILITY,
    SET_TILE_VIEW_MAX_COLUMNS,
    SET_TILE_VIEW_SETTINGS_VISIBILITY,
    SET_VIDEO_SETTINGS_VISIBILITY
} from './actionTypes';
import LogoutDialog from './components/web/LogoutDialog';
import SettingsDialog from './components/web/SettingsDialog';
import {
    getModeratorTabProps,
    getMoreTabProps,
    getNotificationsTabProps,
    getProfileTabProps,
    getShortcutsTabProps
} from './functions.web';


/**
 * Opens {@code LogoutDialog}.
 *
 * @returns {Function}
 */
export function openLogoutDialog() {
    return (dispatch, getState) => {
        const state = getState();

        const config = state['features/base/config'];
        const logoutUrl = config.tokenLogoutUrl;

        const { conference } = state['features/base/conference'];
        const { jwt } = state['features/base/jwt'];

        dispatch(openDialog(LogoutDialog, {
            onLogout() {
                if (isTokenAuthEnabled(config) && config.tokenAuthUrlAutoRedirect && jwt) {

                    // user is logging out remove auto redirect indication
                    dispatch(setTokenAuthUrlSuccess(false));
                }

                if (logoutUrl && browser.isElectron()) {
                    const url = appendURLHashParam(logoutUrl, 'electron', 'true');

                    window.open(url, '_blank');
                    dispatch(hangup(true));
                } else {
                    if (logoutUrl) {
                        window.location.href = logoutUrl;

                        return;
                    }

                    conference?.room.xmpp.moderator.logout(() => dispatch(hangup(true)));
                }
            }
        }));
    };
}

/**
 * Opens {@code SettingsDialog}.
 *
 * @param {string} defaultTab - The tab in {@code SettingsDialog} that should be
 * displayed initially.
 * @param {boolean} isDisplayedOnWelcomePage - Indicates whether the device selection dialog is displayed on the
 * welcome page or not.
 * @returns {Function}
 */
export function openSettingsDialog(defaultTab: string, isDisplayedOnWelcomePage: boolean) {
    return openDialog(SettingsDialog, {
        defaultTab,
        isDisplayedOnWelcomePage
    });
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
 * Sets the visibility of the tile view settings.
 *
 * @param {boolean} value - The new value.
 * @returns {Function}
 */
function setTileViewSettingsVisibility(value: boolean) {
    return {
        type: SET_TILE_VIEW_SETTINGS_VISIBILITY,
        value
    };
}

/**
 * Sets the max columns of the tile view settings.
 *
 * @param {number} value - The new value.
 * @returns {Function}
 */
export function setTileViewMaxColumns(value: number) {
    return {
        type: SET_TILE_VIEW_MAX_COLUMNS,
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

        const showPrejoinPage = newState.showPrejoinPage;

        if (showPrejoinPage !== currentState.showPrejoinPage) {
            dispatch(updateSettings({
                userSelectedSkipPrejoin: !showPrejoinPage
            }));
        }

        if (newState.maxStageParticipants !== currentState.maxStageParticipants) {
            dispatch(updateSettings({ maxStageParticipants: Number(newState.maxStageParticipants) }));
        }

        if (newState.hideSelfView !== currentState.hideSelfView) {
            dispatch(updateSettings({ disableSelfView: newState.hideSelfView }));
        }

        if (newState.currentLanguage !== currentState.currentLanguage) {
            i18next.changeLanguage(newState.currentLanguage);
        }
    };
}

/**
 * Submits the settings from the "Moderator" tab of the settings dialog.
 *
 * @param {Object} newState - The new settings.
 * @returns {Function}
 */
export function submitModeratorTab(newState: Object): Function {
    return (dispatch, getState) => {
        const currentState = getModeratorTabProps(getState());

        if (newState.followMeEnabled !== currentState.followMeEnabled) {
            dispatch(setFollowMe(newState.followMeEnabled));
        }

        if (newState.startReactionsMuted !== currentState.startReactionsMuted) {
            batch(() => {
                // updating settings we want to update and backend (notify the rest of the participants)
                dispatch(setStartReactionsMuted(newState.startReactionsMuted, true));
                dispatch(updateSettings({ soundsReactions: !newState.startReactionsMuted }));
            });
        }

        if (newState.startAudioMuted !== currentState.startAudioMuted
            || newState.startVideoMuted !== currentState.startVideoMuted) {
            dispatch(setStartMutedPolicy(
                newState.startAudioMuted, newState.startVideoMuted));
        }

        if (newState.whiteboardUserVisible !== currentState.whiteboardUserVisible) {
            const { roomInfo } = getState()['features/base/conference'];
            conferences()
                .id(roomInfo._id)
                .update({ whiteboard: {
                    ...(roomInfo.whiteboard || {}),
                    userVisible: newState.whiteboardUserVisible,
                }})
                .then(resp => {
                    console.log('conference updated:', resp.data);
                    dispatch(setRoomInfo(resp.data));

                    if (typeof APP !== 'undefined') {
                        const whiteboardManager = APP.UI.getWhiteboardManager();
                        if (whiteboardManager && whiteboardManager.isOpen) {
                            whiteboardManager.reload();
                        }
                    }
                });
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
        if (newState.displayName === "" || newState.displayName === undefined || newState.displayName.trim() === "") {
            dispatch(showNotification({
                titleKey: 'notify.noNameInsertedInProfileTab'
            }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        } else {
            // else, proceed to updating profile information
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
        }
    };
}

/**
 * Submits the settings from the "Sounds" tab of the settings dialog.
 *
 * @param {Object} newState - The new settings.
 * @returns {Function}
 */
export function submitNotificationsTab(newState: Object): Function {
    return (dispatch, getState) => {
        const currentState = getNotificationsTabProps(getState());
        const shouldNotUpdateReactionSounds = getModeratorTabProps(getState()).startReactionsMuted;
        const shouldUpdate = (newState.soundsIncomingMessage !== currentState.soundsIncomingMessage)
            || (newState.soundsParticipantJoined !== currentState.soundsParticipantJoined)
            || (newState.soundsParticipantKnocking !== currentState.soundsParticipantKnocking)
            || (newState.soundsParticipantLeft !== currentState.soundsParticipantLeft)
            || (newState.soundsTalkWhileMuted !== currentState.soundsTalkWhileMuted)
            || (newState.soundsReactions !== currentState.soundsReactions);

        if (shouldUpdate) {
            const settingsToUpdate = {
                soundsIncomingMessage: newState.soundsIncomingMessage,
                soundsParticipantJoined: newState.soundsParticipantJoined,
                soundsParticipantKnocking: newState.soundsParticipantKnocking,
                soundsParticipantLeft: newState.soundsParticipantLeft,
                soundsTalkWhileMuted: newState.soundsTalkWhileMuted,
                soundsReactions: newState.soundsReactions
            };

            if (shouldNotUpdateReactionSounds) {
                delete settingsToUpdate.soundsReactions;
            }
            dispatch(updateSettings(settingsToUpdate));
        }

        const enabledNotifications = newState.enabledNotifications;

        if (enabledNotifications !== currentState.enabledNotifications) {
            dispatch(updateSettings({
                userSelectedNotifications: {
                    ...getState()['features/base/settings'].userSelectedNotifications,
                    ...enabledNotifications
                }
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

/**
 * Submits the settings from the "Shortcuts" tab of the settings dialog.
 *
 * @param {Object} newState - The new settings.
 * @returns {Function}
 */
export function submitShortcutsTab(newState: any) {
    return (dispatch: Function, getState: Function) => {
        const currentState = getShortcutsTabProps(getState());

        if (newState.keyboardShortcutsEnabled !== currentState.keyboardShortcutsEnabled) {
            if (newState.keyboardShortcutsEnabled) {
                dispatch(enableKeyboardShortcuts());
            } else {
                dispatch(disableKeyboardShortcuts());
            }
        }
    };
}

/**
 * Submits the settings from the "Virtual Background" tab of the settings dialog.
 *
 * @param {Object} newState - The new settings.
 * @param {boolean} isCancel - Whether the change represents a cancel.
 * @returns {Function}
 */
export function submitVirtualBackgroundTab(newState: any, isCancel = false) {
    return async (dispatch: Function, getState: Function) => {
        const state = getState();
        const track = getLocalVideoTrack(state['features/base/tracks'])?.jitsiTrack;

        if (newState.options?.selectedThumbnail) {
            await dispatch(toggleBackgroundEffect(newState.options, track));

            if (!isCancel) {
                // Set x scale to default value.
                dispatch(updateSettings({
                    localFlipX: true
                }));

                virtualBackgroundLogger.info(`Virtual background type: '${
                    typeof newState.options.backgroundType === 'undefined'
                        ? 'none' : newState.options.backgroundType}' applied!`);
            }
        }
    };
}
