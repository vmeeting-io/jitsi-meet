// @flow
import { getCurrentConference } from '../base/conference/functions';
import { getVisitorsCount } from '../visitors/functions';

/**
* Selector to return lobby enable state.
*
* @param {any} state - State object.
* @returns {boolean}
*/
export function getLobbyEnabled(state: any) {
    return state['features/lobby'].lobbyEnabled;
}

/**
* Selector to return a list of knocking participants.
*
* @param {any} state - State object.
* @returns {Array<Object>}
*/
export function getKnockingParticipants(state: any) {
    return state['features/lobby'].knockingParticipants;
}

/**
 * Selector to return lobby visibility.
 *
 * @param {any} state - State object.
 * @returns {any}
 */
export function getIsLobbyVisible(state: any) {
    return state['features/lobby'].lobbyVisible;
}

/**
 * Selector to return array with knocking participant ids.
 *
 * @param {any} state - State object.
 * @returns {Array}
 */
export function getKnockingParticipantsById(state: any) {
    return getKnockingParticipants(state).map(participant => participant.id);
}

/**
 * Selector to return the lobby config.
 *
 * @param {IReduxState} state - State object.
 * @returns {Object}
 */
export function getLobbyConfig(state: any) {
    return state['features/base/config']?.lobby || {};
}

/**
 * Function that handles the visibility of the lobby chat message.
 *
 * @param {Object} participant - Lobby Participant.
 * @returns {Function}
 */
export function showLobbyChatButton(
        participant: Object
) {
    return function(state: any) {

        const { enableChat = true } = getLobbyConfig(state);
        const { lobbyMessageRecipient, isLobbyChatActive } = state['features/chat'];
        const conference = getCurrentConference(state);

        const lobbyLocalId = conference?.myLobbyUserId();

        if (!enableChat) {
            return false;
        }

        if (!isLobbyChatActive
        && (!participant.chattingWithModerator
        || participant.chattingWithModerator === lobbyLocalId)
        ) {
            return true;
        }

        if (isLobbyChatActive && lobbyMessageRecipient
        && participant.id !== lobbyMessageRecipient.id
            && (!participant.chattingWithModerator
                || participant.chattingWithModerator === lobbyLocalId)) {
            return true;
        }

        return false;
    };
}

/**
 * Returns true if enabling lobby is allowed and false otherwise.
 *
 * @param {IReduxState} state - State object.
 * @returns {boolean}
 */
export function isEnablingLobbyAllowed(state: any) {
    return getVisitorsCount(state) <= 0;
}
