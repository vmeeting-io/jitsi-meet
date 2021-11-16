/**
 * Create an action for when the settings are updated.
 *
 * {
 *     type: SETTINGS_UPDATED,
 *     settings: {
 *         audioOutputDeviceId: string,
 *         avatarURL: string,
 *         cameraDeviceId: string,
 *         displayName: string,
 *         email: string,
 *         localFlipX: boolean,
 *         micDeviceId: string,
 *         serverURL: string,
 *         startAudioOnly: boolean,
 *         startWithAudioMuted: boolean,
 *         startWithVideoMuted: boolean
 *     }
 * }
 */
export const SETTINGS_UPDATED = 'SETTINGS_UPDATED';

export const SET_AI_ATTENTION_ANALYSIS = 'SET_AI_ATTENTION_ANALYSIS';