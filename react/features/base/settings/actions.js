import { SETTINGS_UPDATED, SET_AI_ATTENTION_ANALYSIS } from './actionTypes';

/**
 * Create an action for when the settings are updated.
 *
 * @param {Object} settings - The new (partial) settings properties.
 * @returns {{
 *     type: SETTINGS_UPDATED,
 *     settings: {
 *         audioOutputDeviceId: string,
 *         avatarURL: string,
 *         cameraDeviceId: string,
 *         displayName: string,
 *         email: string,
 *         birthDate: string,
 *         localFlipX: boolean,
 *         micDeviceId: string,
 *         serverURL: string,
 *         startAudioOnly: boolean,
 *         startWithAudioMuted: boolean,
 *         startWithVideoMuted: boolean
 *     }
 * }}
 */
export function updateSettings(settings) {
    return {
        type: SETTINGS_UPDATED,
        settings
    };
}

export function setAIAttentionSettings(value: boolean) {
    return {
        type: SET_AI_ATTENTION_ANALYSIS,
        value
    };
}
