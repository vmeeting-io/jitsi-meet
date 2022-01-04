/* @flow */

import { MEDIA_TYPE } from '../base/media/constants';
import {
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED
} from '../base/participants';
import { ReducerRegistry } from '../base/redux';

import {
    DISABLE_MODERATION,
    DISMISS_PENDING_PARTICIPANT,
    ENABLE_MODERATION,
    LOCAL_PARTICIPANT_APPROVED,
    LOCAL_PARTICIPANT_REJECTED,
    PARTICIPANT_APPROVED,
    PARTICIPANT_PENDING_AUDIO,
    PARTICIPANT_REJECTED
} from './actionTypes';

const initialState = {
    moderationEnabled: {
        audio: false,
        video: false,
        chat: false,
        poll: false,
        name: false,
    },
    whitelist: {
        audio: {},
        video: {},
        chat: {},
        poll: {},
        name: {},
    },
    pending: {
        audio: [],
        video: [],
        chat: [],
        poll: [],
        name: [],
    },
    unmuteApproved: {
        audio: false,
        video: false,
        chat: false,
        poll: false,
        name: false,
    }
};

/**
 Updates a participant in the state for the specified media type.
 *
 * @param {string} kind - The kind of moderation.
 * @param {Object} participant - Information about participant to be modified.
 * @param {Object} state - The current state.
 * @private
 * @returns {boolean} - Whether state instance was modified.
 */
function _updatePendingParticipant(kind: string, participant, state: Object = {}) {
    let arrayItemChanged = false;
    const arr = state.pending[kind] || [];
    const newArr = arr.map(pending => {
        if (pending.id === participant.id) {
            arrayItemChanged = true;

            return {
                ...pending,
                ...participant
            };
        }

        return pending;
    });

    if (arrayItemChanged) {
        state.pending[kind] = newArr;

        return true;
    }

    return false;
}

ReducerRegistry.register('features/av-moderation', (state = initialState, action) => {

    switch (action.type) {
    case DISABLE_MODERATION: {
        const moderationEnabled = { ...state.moderationEnabled, [action.kind]: false };
        const unmuteApproved = { ...state.unmuteApproved, [action.kind]: false };

        return {
            ...state,
            moderationEnabled,
            unmuteApproved,
            whitelist: { ...initialState.whitelist },
            pending: { ...initialState.pending },
        };
    }

    case ENABLE_MODERATION: {
        const moderationEnabled = { ...state.moderationEnabled, [action.kind]: true };

        return {
            ...state,
            moderationEnabled
        };
    }

    case LOCAL_PARTICIPANT_APPROVED: {
        const unmuteApproved = { ...state.unmuteApproved, [action.kind]: true };

        return {
            ...state,
            unmuteApproved
        };
    }

    case LOCAL_PARTICIPANT_REJECTED: {
        const unmuteApproved = { ...state.unmuteApproved, [action.kind]: false };

        return {
            ...state,
            unmuteApproved
        };
    }

    case LOCAL_PARTICIPANT_REJECTED: {
        const newState = action.mediaType === MEDIA_TYPE.AUDIO
            ? { audioUnmuteApproved: false } : { videoUnmuteApproved: false };

        return {
            ...state,
            ...newState
        };
    }

    case PARTICIPANT_PENDING_AUDIO: {
        const { participant } = action;

        // Add participant to pendingAudio array only if it's not already added
        if (!state.pending.audio.find(pending => pending.id === participant.id)) {
            const pending = {
                ...state.pending,
                audio: [ ...state.pending.audio ]
            };

            pending.audio.push(participant);

            return {
                ...state,
                pending
            };
        }

        return state;
    }

    case PARTICIPANT_UPDATED: {
        const participant = action.participant;
        const { moderationEnabled } = state;
        let hasStateChanged = false;

        // skips changing the reference of pendingAudio or pendingVideo,
        // if there is no change in the elements
        if (moderationEnabled.audio) {
            hasStateChanged = _updatePendingParticipant('audio', participant, state);
        }

        if (moderationEnabled.video) {
            hasStateChanged = hasStateChanged || _updatePendingParticipant('video', participant, state);
        }

        // If the state has changed we need to return a new object reference in order to trigger subscriber updates.
        if (hasStateChanged) {
            return {
                ...state
            };
        }

        return state;
    }
    case PARTICIPANT_LEFT: {
        const participant = action.participant;
        const { moderationEnabled } = state;
        let hasStateChanged = false;

        // skips changing the reference of pendingAudio or pendingVideo,
        // if there is no change in the elements
        if (moderationEnabled.audio) {
            const newPendingAudio = state.pending.audio.filter(pending => pending.id !== participant.id);

            if (state.pending.audio.length !== newPendingAudio.length) {
                state.pending.audio = newPendingAudio;
                hasStateChanged = true;
            }
        }

        if (moderationEnabled.video) {
            const newPendingVideo = state.pending.video.filter(pending => pending.id !== participant.id);

            if (state.pending.video.length !== newPendingVideo.length) {
                state.pending.video = newPendingVideo;
                hasStateChanged = true;
            }
        }

        // If the state has changed we need to return a new object reference in order to trigger subscriber updates.
        if (hasStateChanged) {
            return {
                ...state
            };
        }

        return state;
    }

    case DISMISS_PENDING_PARTICIPANT: {
        const { id, kind } = action;
        const newPending = state.pending[kind].filter(pending => pending.id !== id);

        return {
            ...state,
            pending: { ...state.pending, [kind]: newPending } 
        };
    }

    case PARTICIPANT_APPROVED: {
        const { kind, id } = action;
        const newWhitelist = { ...state.whitelist[kind], [id]: true };

        return {
            ...state,
            whitelist: {
                ...state.whitelist,
                [kind]: newWhitelist
            }
        };
    }

    case PARTICIPANT_REJECTED: {
        const { kind, id } = action;
        const newWhitelist = { ...state.whitelist[kind], [id]: false };

        return {
            ...state,
            whitelist: {
                ...state.whitelist,
                [kind]: newWhitelist
            }
        };
    }

    case PARTICIPANT_REJECTED: {
        const { mediaType, id } = action;

        if (mediaType === MEDIA_TYPE.AUDIO) {
            return {
                ...state,
                audioWhitelist: {
                    ...state.audioWhitelist,
                    [id]: false
                }
            };
        }

        if (mediaType === MEDIA_TYPE.VIDEO) {
            return {
                ...state,
                videoWhitelist: {
                    ...state.videoWhitelist,
                    [id]: false
                }
            };
        }

        return state;
    }

    }

    return state;
});
