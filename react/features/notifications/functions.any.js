// @flow

import { jitsiLocalStorage } from '@jitsi/js-utils';

import { MODERATION_NOTIFICATIONS } from '../av-moderation/constants';
import { MEDIA_TYPE } from '../base/media';
import { toState } from '../base/redux';

import { NOTIFICATION_TYPE } from './constants';

declare var interfaceConfig: Object;

/**
 * Tells whether or not the notifications are enabled and if there are any
 * notifications to be displayed based on the current Redux state.
 *
 * @param {Object|Function} stateful - The redux store state.
 * @returns {boolean}
 */
export function areThereNotifications(stateful: Object | Function) {
    const state = toState(stateful);
    const { enabled, notifications } = state['features/notifications'];

    return enabled && notifications.length > 0;
}

/**
 * Tells whether join/leave notifications are enabled in interface_config.
 *
 * @returns {boolean}
 */
export function joinLeaveNotificationsDisabled() {
    return Boolean(typeof interfaceConfig !== 'undefined' && interfaceConfig?.DISABLE_JOIN_LEAVE_NOTIFICATIONS);
}

/**
 * Returns whether or not the moderation notification for the given type is displayed.
 *
 * @param {MEDIA_TYPE} mediaType - The media type to check.
 * @param {Object | Function} stateful - The redux store state.
 * @returns {boolean}
 */
export function isModerationNotificationDisplayed(mediaType: MEDIA_TYPE, stateful: Object | Function) {
    const state = toState(stateful);

    const { notifications } = state['features/notifications'];

    return Boolean(notifications.find(n => n.uid === MODERATION_NOTIFICATIONS[mediaType]));
}

/**
 * Saves an error notification for display.
 *
 * @param {Object} props - The props needed to show the notification component.
 * @returns {Object}
 */
export function saveErrorNotification(props: Object) {
    return saveNotification({
        ...props,
        appearance: NOTIFICATION_TYPE.ERROR
    });
}

/**
 * Saves a warning notification for display.
 *
 * @param {Object} props - The props needed to show the notification component.
 * @returns {Object}
 */
export function saveWarningNotification(props: Object) {
    return saveNotification({
        ...props,
        appearance: NOTIFICATION_TYPE.WARNING
    });
}

/**
 * Saves a notification for display.
 *
 * @param {Object} props - The props needed to show the notification component.
 * @param {number} timeout - How long the notification should display before
 * automatically being hidden.
 * @returns {Function}
 */
export function saveNotification(props: Object = {}, timeout: ?number) {
    return () => {
        jitsiLocalStorage.setItem('saved_notification', JSON.stringify({
            props,
            timeout,
            uid: window.Date.now()
        }));
    };    
}
