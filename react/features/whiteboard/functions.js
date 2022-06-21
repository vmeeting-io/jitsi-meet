// @flow

import { isForceMuted } from '../participants-pane/functions';
import { toState } from '../base/redux';
import { getLocalParticipant } from '../base/participants';

/**
 * Retrieves the current whiteboard URL.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState} function.
 * @returns {?string} - Current whiteboard URL or undefined.
 */
export function getWhiteboardUrl(stateful: Function | Object) {
    const state = toState(stateful);
    const { url } = state['features/whiteboard'];
    const { displayName } = state['features/base/settings'];
    const local = getLocalParticipant(state);
    const approved = !isForceMuted(local, 'whiteboard', state);

    if (!url) {
        return undefined;
    }

    const WHITEBOARD_OPTIONS = {
        role: approved ? 'owner' : 'participant'
    };

    const params = new URLSearchParams(WHITEBOARD_OPTIONS);

    if (local?.name || displayName) {
        params.append('userName', local?.name || displayName);
    }

    return `${url}?${params.toString()}`;
}