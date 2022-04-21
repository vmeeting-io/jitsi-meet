// @flow

import { getCurrentConference, setFollowMe } from '../base/conference';
import { getLocalParticipant } from '../base/participants';

import {
    SET_FOLLOW_ME_MODERATOR,
    SET_FOLLOW_ME_STATE
} from './actionTypes';
import { GRANT_FOLLOW_ME_MODERATOR } from './constants';

/**
 * Sets the current moderator id or clears it.
 *
 * @param {?string} id - The Follow Me moderator participant id.
 * @returns {{
 *     type: SET_FOLLOW_ME_MODERATOR,
 *     id, string
 * }}
 */
export function setFollowMeModerator(id: ?string) {
    return {
        type: SET_FOLLOW_ME_MODERATOR,
        id
    };
}

/**
 * Sets the Follow Me feature state.
 *
 * @param {?Object} state - The current state.
 * @returns {{
 *     type: SET_FOLLOW_ME_STATE,
 *     state: Object
 * }}
 */
export function setFollowMeState(state: ?Object, value: ?string) {
    return {
        type: SET_FOLLOW_ME_STATE,
        state,
        value
    };
}

export function grantFollowMeModerator(id: ?string, right: ?boolean) {
    return function(dispatch, getState) {
        const state = getState();
        const conference = getCurrentConference(state);
        const localParticipant = getLocalParticipant(state);
        const { moderator } = state['features/follow-me'];

        // disable old follow me moderator
        if (moderator) {
            conference.sendMessage({
                type: GRANT_FOLLOW_ME_MODERATOR,
                id: moderator,
                enabled: false
            }, moderator);
        } else {
            dispatch(setFollowMe(false));
        }

        if (right) {
            setTimeout(() => {
                if (id === localParticipant.id) {
                    dispatch(setFollowMe(true));
                } else {
                    conference.sendMessage({
                        type: GRANT_FOLLOW_ME_MODERATOR,
                        id,
                        enabled: true
                    }, id);
                }
            });
        }
    };
}
