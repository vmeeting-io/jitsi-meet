import { NOTIFICATION_TIMEOUT, showNotification, showToast } from '../../notifications';
import { i18next } from '../i18n';
import { set } from '../redux';

import {
    DOMINANT_SPEAKER_CHANGED,
    HIDDEN_PARTICIPANT_JOINED,
    HIDDEN_PARTICIPANT_LEFT,
    GRANT_MODERATOR,
    KICK_PARTICIPANT,
    DISABLE_CHAT_FOR_ALL,
    DISABLE_CHAT_PARTICIPANT,
    ENABLE_CHAT_PARTICIPANT,
    ENABLE_CHAT_FOR_ALL,
    MUTE_REMOTE_PARTICIPANT,
    PARTICIPANT_ID_CHANGED,
    PARTICIPANT_JOINED,
    PARTICIPANT_KICKED,
    MODERATOR_ROLE_GRANTED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED,
    PIN_PARTICIPANT,
    RECV_VIDEO_PARTICIPANT,
    SET_LOADABLE_AVATAR_URL,
    MUTE_REMOTE_PARTICIPANT_VIDEO
} from './actionTypes';
import {
    getLocalParticipant,
    getNormalizedDisplayName,
    getParticipantDisplayName
} from './functions';
import UIEvents from '../../../../service/UI/UIEvents';

/**
 * Create an action for when dominant speaker changes.
 *
 * @param {string} id - Participant's ID.
 * @param {JitsiConference} conference - The {@code JitsiConference} associated
 * with the participant identified by the specified {@code id}. Only the local
 * participant is allowed to not specify an associated {@code JitsiConference}
 * instance.
 * @returns {{
 *     type: DOMINANT_SPEAKER_CHANGED,
 *     participant: {
 *         conference: JitsiConference,
 *         id: string
 *     }
 * }}
 */
export function dominantSpeakerChanged(id, conference) {
    return {
        type: DOMINANT_SPEAKER_CHANGED,
        participant: {
            conference,
            id
        }
    };
}

/**
 * Create an action for granting moderator to a participant.
 *
 * @param {string} id - Participant's ID.
 * @returns {{
 *     type: GRANT_MODERATOR,
 *     id: string
 * }}
 */
export function grantModerator(id) {
    return {
        type: GRANT_MODERATOR,
        id
    };
}

/**
 * Create an action for removing a participant from the conference.
 *
 * @param {string} id - Participant's ID.
 * @returns {{
 *     type: KICK_PARTICIPANT,
 *     id: string
 * }}
 */
export function kickParticipant(id) {
    return {
        type: KICK_PARTICIPANT,
        id
    };
}

/**
 * Create an action for disabling chat for a participant from the conference.
 *
 * @param {string} id - Participant's ID.
 * @returns {{
    *     type: DISABLE_CHAT_PARTICIPANT,
    *     id: string
    * }}
    */
export function disableChatForParticipant(id) {
    return {
        type: DISABLE_CHAT_PARTICIPANT,
        id
    };
}

/**
 * Create an action for disabling chat for all participants in the conference.
 *
 * @param {} - NO params
 * @returns {{
    *     type: DISABLE_CHAT_FOR_ALL
    * }}
    */
export function disableChatForAll() {
    return {
        type: DISABLE_CHAT_FOR_ALL
    };
}

/**
 * Create an action for enabling chat for a participant from the conference.
 *
 * @param {string} id - Participant's ID.
 * @returns {{
    *     type: ENABLE_CHAT_PARTICIPANT,
    *     id: string
    * }}
    */
export function enableChatForParticipant(id) {
    return {
        type: ENABLE_CHAT_PARTICIPANT,
        id
    };
}

/**
 * Create an action for enabling chat for all participant in the conference.
 *
 * @param { No params } 
 * @returns {{
    *     type: ENABLE_CHAT_FOR_ALL
    * }}
    */
export function enableChatForAll() {
    return {
        type: ENABLE_CHAT_FOR_ALL
    };
}

/**
 * Creates an action to signal the connection status of the local participant
 * has changed.
 *
 * @param {string} connectionStatus - The current connection status of the local
 * participant, as enumerated by the library's participantConnectionStatus
 * constants.
 * @returns {Function}
 */
export function localParticipantConnectionStatusChanged(connectionStatus) {
    return (dispatch, getState) => {
        const participant = getLocalParticipant(getState);

        if (participant) {
            return dispatch(participantConnectionStatusChanged(
                participant.id,
                connectionStatus));
        }
    };
}

/**
 * Action to signal that the ID of local participant has changed. It happens
 * when the local participant joins a new conference or leaves an existing
 * conference.
 *
 * @param {string} id - New ID for local participant.
 * @returns {Function}
 */
export function localParticipantIdChanged(id) {
    return (dispatch, getState) => {
        const participant = getLocalParticipant(getState);

        if (participant) {
            return dispatch({
                type: PARTICIPANT_ID_CHANGED,

                // XXX A participant is identified by an id-conference pair.
                // Only the local participant is with an undefined conference.
                conference: undefined,
                newValue: id,
                oldValue: participant.id
            });
        }
    };
}

/**
 * Action to signal that a local participant has joined.
 *
 * @param {Participant} participant={} - Information about participant.
 * @returns {{
 *     type: PARTICIPANT_JOINED,
 *     participant: Participant
 * }}
 */
export function localParticipantJoined(participant = {}) {
    return participantJoined(set(participant, 'local', true));
}

/**
 * Action to remove a local participant.
 *
 * @returns {Function}
 */
export function localParticipantLeft() {
    return (dispatch, getState) => {
        const participant = getLocalParticipant(getState);

        if (participant) {
            return (
                dispatch(
                    participantLeft(
                        participant.id,

                        // XXX Only the local participant is allowed to leave
                        // without stating the JitsiConference instance because
                        // the local participant is uniquely identified by the
                        // very fact that there is only one local participant
                        // (and the fact that the local participant "joins" at
                        // the beginning of the app and "leaves" at the end of
                        // the app).
                        undefined)));
        }
    };
}

/**
 * Action to signal the role of the local participant has changed. It can happen
 * when the participant has joined a conference, even before a non-default local
 * id has been set, or after a moderator leaves.
 *
 * @param {string} role - The new role of the local participant.
 * @returns {Function}
 */
export function localParticipantRoleChanged(role) {
    return (dispatch, getState) => {
        const participant = getLocalParticipant(getState);

        if (participant) {
            if (role === "moderator"){
                APP.UI.emitEvent(UIEvents.BECOME_MODERATOR);
            }

            return dispatch(participantRoleChanged(participant.id, role));
        }
    };
}

/**
 * Create an action for muting another participant in the conference.
 *
 * @param {string} id - Participant's ID.
 * @returns {{
 *     type: MUTE_REMOTE_PARTICIPANT,
 *     id: string,
 *     mute: Boolean
 * }}
 */
export function muteRemoteParticipant(id, mute) {
    return {
        type: MUTE_REMOTE_PARTICIPANT,
        id,
        mute
    };
}

/**
 * Create an action for muting video another participant in the conference.
 *
 * @param {string} id - Participant's ID.
 * @returns {{
 *     type: MUTE_REMOTE_PARTICIPANT_VIDEO,
 *     id: string,
 *     mute: Boolean
 * }}
 */
export function muteRemoteParticipantVideo(id, mute) {
    return {
        type: MUTE_REMOTE_PARTICIPANT_VIDEO,
        id,
        mute
    };
}

/**
 * Action to update a participant's connection status.
 *
 * @param {string} id - Participant's ID.
 * @param {string} connectionStatus - The new connection status of the
 * participant.
 * @returns {{
 *     type: PARTICIPANT_UPDATED,
 *     participant: {
 *         connectionStatus: string,
 *         id: string
 *     }
 * }}
 */
export function participantConnectionStatusChanged(id, connectionStatus) {
    return {
        type: PARTICIPANT_UPDATED,
        participant: {
            connectionStatus,
            id
        }
    };
}

/**
 * Action to signal that a participant has joined.
 *
 * @param {Participant} participant - Information about participant.
 * @returns {{
 *     type: PARTICIPANT_JOINED,
 *     participant: Participant
 * }}
 */
export function participantJoined(participant) {
    // Only the local participant is not identified with an id-conference pair.
    if (participant.local) {
        return {
            type: PARTICIPANT_JOINED,
            participant
        };
    }

    // In other words, a remote participant is identified with an id-conference
    // pair.
    const { conference } = participant;

    if (!conference) {
        throw Error(
            'A remote participant must be associated with a JitsiConference!');
    }

    return (dispatch, getState) => {
        // A remote participant is only expected to join in a joined or joining
        // conference. The following check is really necessary because a
        // JitsiConference may have moved into leaving but may still manage to
        // sneak a PARTICIPANT_JOINED in if its leave is delayed for any purpose
        // (which is not outragous given that leaving involves network
        // requests.)
        const stateFeaturesBaseConference
            = getState()['features/base/conference'];

        if (conference === stateFeaturesBaseConference.conference
                || conference === stateFeaturesBaseConference.joining) {
            return dispatch({
                type: PARTICIPANT_JOINED,
                participant
            });
        }
    };
}

/**
 * Action to signal that a hidden participant has joined the conference.
 *
 * @param {string} id - The id of the participant.
 * @param {string} displayName - The display name, or undefined when
 * unknown.
 * @returns {{
 *     type: HIDDEN_PARTICIPANT_JOINED,
 *     displayName: string,
 *     id: string
 * }}
 */
export function hiddenParticipantJoined(id, displayName) {
    return {
        type: HIDDEN_PARTICIPANT_JOINED,
        id,
        displayName
    };
}

/**
 * Action to signal that a hidden participant has left the conference.
 *
 * @param {string} id - The id of the participant.
 * @returns {{
 *     type: HIDDEN_PARTICIPANT_LEFT,
 *     id: string
 * }}
 */
export function hiddenParticipantLeft(id) {
    return {
        type: HIDDEN_PARTICIPANT_LEFT,
        id
    };
}

/**
 * Action to signal that a participant has left.
 *
 * @param {string} id - Participant's ID.
 * @param {JitsiConference} conference - The {@code JitsiConference} associated
 * with the participant identified by the specified {@code id}. Only the local
 * participant is allowed to not specify an associated {@code JitsiConference}
 * instance.
 * @returns {{
 *     type: PARTICIPANT_LEFT,
 *     participant: {
 *         conference: JitsiConference,
 *         id: string
 *     }
 * }}
 */
export function participantLeft(id, conference) {
    return {
        type: PARTICIPANT_LEFT,
        participant: {
            conference,
            id
        }
    };
}

/**
 * Action to signal that a participant's presence status has changed.
 *
 * @param {string} id - Participant's ID.
 * @param {string} presence - Participant's new presence status.
 * @returns {{
 *     type: PARTICIPANT_UPDATED,
 *     participant: {
 *         id: string,
 *         presence: string
 *     }
 * }}
 */
export function participantPresenceChanged(id, presence) {
    return participantUpdated({
        id,
        presence
    });
}

/**
 * Action to signal that a participant's role has changed.
 *
 * @param {string} id - Participant's ID.
 * @param {PARTICIPANT_ROLE} role - Participant's new role.
 * @returns {{
 *     type: PARTICIPANT_UPDATED,
 *     participant: {
 *         id: string,
 *         role: PARTICIPANT_ROLE
 *     }
 * }}
 */
export function participantRoleChanged(id, role) {
    return participantUpdated({
        id,
        role
    });
}

/**
 * Action to signal that some of participant properties has been changed.
 *
 * @param {Participant} participant={} - Information about participant. To
 * identify the participant the object should contain either property id with
 * value the id of the participant or property local with value true (if the
 * local participant hasn't joined the conference yet).
 * @returns {{
 *     type: PARTICIPANT_UPDATED,
 *     participant: Participant
 * }}
 */
export function participantUpdated(participant = {}) {
    const participantToUpdate = {
        ...participant
    };

    if (participant.name) {
        participantToUpdate.name = getNormalizedDisplayName(participant.name);
    }

    return {
        type: PARTICIPANT_UPDATED,
        participant: participantToUpdate
    };
}

/**
 * Action to signal that a participant has muted us.
 *
 * @param {JitsiParticipant} participant - Information about participant.
 * @returns {Promise}
 */
export function participantMutedUs(track, participant) {
    return (dispatch, getState) => {
        if (!participant || !track.isMuted()) {
            return;
        }

        const title = 'notify.mutedRemotelyTitle';
        showToast({
            title: i18next.t(title, {
                participantDisplayName:
                    getParticipantDisplayName(getState, participant.getId())
            })
        });
    };
}

/**
 * Action to signal that a participant had been kicked.
 *
 * @param {JitsiParticipant} kicker - Information about participant performing the kick.
 * @param {JitsiParticipant} kicked - Information about participant that was kicked.
 * @returns {Promise}
 */
export function participantKicked(kicker, kicked) {
    return (dispatch, getState) => {

        dispatch({
            type: PARTICIPANT_KICKED,
            kicked: kicked.getId(),
            kicker: kicker.getId()
        });

        showToast({
            title: i18next.t('notify.kickParticipant', {
                kicked:
                    getParticipantDisplayName(getState, kicked.getId()),
                kicker:
                    getParticipantDisplayName(getState, kicker.getId())
            }),
            timeout: NOTIFICATION_TIMEOUT * 2 });
        // dispatch(showNotification({
        //     titleArguments: {
        //         kicked:
        //             getParticipantDisplayName(getState, kicked.getId()),
        //         kicker:
        //             getParticipantDisplayName(getState, kicker.getId())
        //     },
        //     titleKey: 'notify.kickParticipant'
        // }, NOTIFICATION_TIMEOUT * 10)); // leave more time for this
    };
}

/**
 * Create an action which pins a conference participant.
 *
 * @param {string|null} id - The ID of the conference participant to pin or null
 * if none of the conference's participants are to be pinned.
 * @returns {{
 *     type: PIN_PARTICIPANT,
 *     participant: {
 *         id: string
 *     }
 * }}
 */
export function pinParticipant(id) {
    return {
        type: PIN_PARTICIPANT,
        participant: {
            id
        }
    };
}

/**
 * Create an action which signal jvb to receive or not video of a conference participant.
 *
 * @param {string|null} id - The ID of the conference participant to pin or null
 * if none of the conference's participants are to be pinned.
 * @returns {{
 *     type: RECV_VIDEO_PARTICIPANT,
 *     participant: {
 *         id: string,
 *         toRecvVideo: boolean
 *     }
 * }}
 */
export function recvVideoParticipant(participantId, toRecvVideo) {
    return {
        type: RECV_VIDEO_PARTICIPANT,
        participant: {
            id: participantId,
            toRecvVideo: toRecvVideo
        }
    };
}
/**
 * Creates an action which notifies the app that the loadable URL of the avatar of a participant got updated.
 *
 * @param {string} participantId - The ID of the participant.
 * @param {string} url - The new URL.
 * @returns {{
 *     type: SET_LOADABLE_AVATAR_URL,
 *     participant: {
 *         id: string,
 *         loadableAvatarUrl: string
 *     }
 * }}
*/
export function setLoadableAvatarUrl(participantId, url) {
    return {
        type: SET_LOADABLE_AVATAR_URL,
        participant: {
            id: participantId,
            loadableAvatarUrl: url
        }
    };
}
