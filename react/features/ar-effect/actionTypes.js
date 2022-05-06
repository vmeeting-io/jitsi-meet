// @flow

/**
 * The type of redux action dispatched which represents that the background
 * effect is enabled or not.
 *
 * @returns {{
 *     type: BACKGROUND_ENABLED,
 *     backgroundEffectEnabled: boolean
 * }}
 */
export const AR_ENABLED = 'AR_ENABLED';

/**
 * The type of redux action dispatched which represents if AR_APPROVAL_DIALOG
 * is displayed or not.
 *
 * @returns {{
 *     type: AR_APPROVAL_DIALOG,
 *     arApprovalDialog: boolean
 * }}
 */
export const AR_APPROVAL_DIALOG = 'AR_APPROVAL_DIALOG';

/**
 * The type of the action which enables or disables virtual background
 *
 * @returns {{
 *     type: SET_VIRTUAL_BACKGROUND,
 *     virtualSource: string,
 *     blurValue: number,
 *     backgroundType: string,
 *     selectedThumbnail: string
 * }}
 */
export const SET_AR = 'SET_AR';
