// @flow

import { toState } from '../base/redux';
import {
    PARTICIPANT_ROLE,
    getLocalParticipant
} from '../base/participants';

/**
 * Retrieves the current sahred document URL.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState} function.
 * @returns {?string} - Current shared document URL or undefined.
 */
export function getSharedDocumentUrl(stateful: Function | Object) {
    const state = toState(stateful);
    const { documentUrl } = state['features/etherpad'];
    const { displayName } = state['features/base/settings'];
    const localParticipant = getLocalParticipant(state);

    if (!documentUrl) {
        return undefined;
    }

    const ETHERPAD_OPTIONS = {
        adminOnly: true,
        isAdmin: localParticipant.role === PARTICIPANT_ROLE.MODERATOR? true : false
    };

    const params = new URLSearchParams(ETHERPAD_OPTIONS);

    if (displayName) {
        params.append('userName', displayName);
    }

    return `${documentUrl}?${params.toString()}`;
}