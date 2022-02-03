// @flow

/**
 * The type of redux action dispatched which represents that the virtual avatar
 * effect is enabled or not.
 *
 * @returns {{
 *     type: VIRTUAL_AVATAR_ENABLED,
 *     virtualAvatarEffectEnabled: boolean
 * }}
 */
export const VIRTUAL_AVATAR_ENABLED = 'VIRTUAL_AVATAR_ENABLED';

/**
 * The type of the action which enables or disables virtual avatar
 *
 * @returns {{
 *     type: SET_VIRTUAL_AVATAR,
 *     virtualSource: string,
 *     virtualAvatarType: string,
 *     selectedVirtualAvatarUrl: string
 * }}
 */
export const SET_VIRTUAL_AVATAR = 'SET_VIRTUAL_AVATAR';

/**
 * The type which signals if the local track was changed due to a changes of the virtual avatar.
 *
 * @returns {{
 *     type: VIRTUAL_AVATAR_TRACK_CHANGED
 *}}
 */

export const VIRTUAL_AVATAR_TRACK_CHANGED = 'VIRTUAL_AVATAR_TRACK_CHANGED';
