// @flow
import { batch } from 'react-redux';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import { getConferenceState } from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../base/media';
import {
    getLocalParticipant,
    getRemoteParticipants,
    hasRaisedHand,
    isLocalParticipantModerator,
    isParticipantModerator,
    PARTICIPANT_UPDATED,
    raiseHand
} from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { playSound, registerSound, unregisterSound } from '../base/sounds';
import {
    NOTIFICATION_TIMEOUT_TYPE,
    showNotification
} from '../notifications';
import { muteLocal } from '../video-menu/actions.any';

import {
    _RESET_MODERATIONS,
    DISABLE_MODERATION,
    ENABLE_MODERATION,
    LOCAL_PARTICIPANT_APPROVED,
    LOCAL_PARTICIPANT_MODERATION_NOTIFICATION,
    LOCAL_PARTICIPANT_REJECTED,
    PARTICIPANT_APPROVED,
    PARTICIPANT_REJECTED,
    REQUEST_DISABLE_MODERATION,
    REQUEST_ENABLE_MODERATION,
} from './actionTypes';
import {
    disableModeration,
    dismissPendingParticipant,
    dismissPendingAudioParticipant,
    enableModeration,
    localParticipantApproved,
    participantApproved,
    participantPendingAudio,
    localParticipantRejected,
    participantRejected,
} from './actions';
import {
    ASKED_TO_UNMUTE_SOUND_ID, AUDIO_MODERATION_NOTIFICATION_ID,
    CS_MODERATION_NOTIFICATION_ID,
    VIDEO_MODERATION_NOTIFICATION_ID
} from './constants';
import {
    isEnabledFromState,
    isParticipantApproved,
    isParticipantPending
} from './functions';
import { ASKED_TO_UNMUTE_FILE } from './sounds';
import { startScreenShareFlow } from '../screen-share';

declare var APP: Object;

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const { type } = action;
    const { conference } = getConferenceState(getState());

    switch (type) {
    case APP_WILL_MOUNT: {
        dispatch(registerSound(ASKED_TO_UNMUTE_SOUND_ID, ASKED_TO_UNMUTE_FILE));
        break;
    }
    case APP_WILL_UNMOUNT: {
        dispatch(unregisterSound(ASKED_TO_UNMUTE_SOUND_ID));
        break;
    }
    case LOCAL_PARTICIPANT_MODERATION_NOTIFICATION: {
        let descriptionKey;
        let titleKey;
        let uid;

        switch (action.kind) {
        case MEDIA_TYPE.AUDIO: {
            titleKey = 'notify.moderationInEffectTitle';
            uid = AUDIO_MODERATION_NOTIFICATION_ID;
            break;
        }
        case MEDIA_TYPE.VIDEO: {
            titleKey = 'notify.moderationInEffectVideoTitle';
            uid = VIDEO_MODERATION_NOTIFICATION_ID;
            break;
        }
        case MEDIA_TYPE.PRESENTER: {
            titleKey = 'notify.moderationInEffectCSTitle';
            uid = CS_MODERATION_NOTIFICATION_ID;
            break;
        }
        }

        dispatch(showNotification({
            customActionNameKey: [ 'notify.raiseHandAction' ],
            customActionHandler: [ () => {
                dispatch(raiseHand(true, action.kind));
                return true;
            } ],
            descriptionKey,
            sticky: true,
            titleKey,
            uid
        }, NOTIFICATION_TIMEOUT_TYPE.STICKY));

        break;
    }
    case REQUEST_DISABLE_MODERATION: {
        conference.disableAVModeration(action.kind);
        break;
    }
    case REQUEST_ENABLE_MODERATION: {
        conference.enableAVModeration(action.kind);
        break;
    }
    case PARTICIPANT_UPDATED: {
        const state = getState();
        const audioModerationEnabled = isEnabledFromState(MEDIA_TYPE.AUDIO, state);
        const participant = action.participant;

        if (participant && audioModerationEnabled) {
            if (isLocalParticipantModerator(state)) {

                // this is handled only by moderators
                if (hasRaisedHand(participant)) {
                    // if participant raises hand show notification
                    !isParticipantApproved(participant.id, MEDIA_TYPE.AUDIO)(state)
                    && dispatch(participantPendingAudio(participant));
                } else {
                    // if participant lowers hand hide notification
                    isParticipantPending(participant, MEDIA_TYPE.AUDIO)(state)
                    && dispatch(dismissPendingAudioParticipant(participant));
                }
            } else if (participant.id === getLocalParticipant(state).id
                && /* the new role */ isParticipantModerator(participant)) {

                // this is the granted moderator case
                getRemoteParticipants(state).forEach(p => {
                    hasRaisedHand(p) && !isParticipantApproved(p.id, MEDIA_TYPE.AUDIO)(state)
                        && dispatch(participantPendingAudio(p));
                });
            }
        }

        break;
    }
    case ENABLE_MODERATION: {
        if (typeof APP !== 'undefined') {
            APP.API.notifyModerationChanged(action.kind, true);
        }
        break;
    }
    case DISABLE_MODERATION: {
        if (typeof APP !== 'undefined') {
            APP.API.notifyModerationChanged(action.kind, false);
        }
        break;
    }
    case LOCAL_PARTICIPANT_APPROVED: {
        if (typeof APP !== 'undefined') {
            const local = getLocalParticipant(getState());

            APP.API.notifyParticipantApproved(local.id, action.kind);
        }
        break;
    }
    case PARTICIPANT_APPROVED: {
        if (typeof APP !== 'undefined') {
            APP.API.notifyParticipantApproved(action.id, action.kind);
        }
        break;
    }
    case LOCAL_PARTICIPANT_REJECTED: {
        if (typeof APP !== 'undefined') {
            const local = getLocalParticipant(getState());

            APP.API.notifyParticipantRejected(local.id, action.kind);
        }
        break;
    }
    case PARTICIPANT_REJECTED: {
        if (typeof APP !== 'undefined') {
            APP.API.notifyParticipantRejected(action.id, action.kind);
        }
        break;
    }
    }

    return next(action);
});

/**
 * Registers a change handler for state['features/base/conference'].conference to
 * set the event listeners needed for the A/V moderation feature to operate.
 */
StateListenerRegistry.register(
    state => state['features/base/conference'].conference,
    (conference, { dispatch }, previousConference) => {
        if (conference && !previousConference) {
            // local participant is allowed to unmute
            conference.on(JitsiConferenceEvents.AV_MODERATION_APPROVED, ({ kind }) => {
                dispatch(localParticipantApproved(kind));

                // Audio & video moderation are both enabled at the same time.
                // Avoid displaying 2 different notifications.
                if (kind === MEDIA_TYPE.AUDIO) {
                    dispatch(showNotification({
                        titleKey: 'notify.hostAskedUnmute',
                        sticky: true,
                        customActionNameKey: [ 'notify.unmute' ],
                        customActionHandler: [ () => dispatch(muteLocal(false, kind)) ]
                    }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
                    dispatch(playSound(ASKED_TO_UNMUTE_SOUND_ID));
                } else if (kind === MEDIA_TYPE.VIDEO) {
                    dispatch(showNotification({
                        titleKey: 'notify.unmuteVideoByHost',
                        sticky: true,
                        customActionNameKey: [ 'notify.unmuteVideo' ],
                        customActionHandler: [ () => dispatch(muteLocal(false, kind)) ]
                    }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
                    dispatch(playSound(ASKED_TO_UNMUTE_SOUND_ID));
                } else if (kind === MEDIA_TYPE.PRESENTER) {
                    dispatch(showNotification({
                        titleKey: 'notify.allowScreenShareByHost',
                        sticky: true,
                        customActionNameKey: ['notify.screenShare'],
                        customActionHandler: [ () => dispatch(startScreenShareFlow()) ]
                    }));
                    dispatch(playSound(ASKED_TO_UNMUTE_SOUND_ID));
                }
            });

            conference.on(JitsiConferenceEvents.AV_MODERATION_REJECTED, ({ kind }) => {
                dispatch(localParticipantRejected(kind));
            });

            conference.on(JitsiConferenceEvents.AV_MODERATION_CHANGED, ({ enabled, kind, actor }) => {
                enabled ? dispatch(enableModeration(kind, actor)) : dispatch(disableModeration(kind, actor));
            });

            // this is received by moderators
            conference.on(
                JitsiConferenceEvents.AV_MODERATION_PARTICIPANT_APPROVED,
                ({ participant, kind }) => {
                    const { _id: id } = participant;

                    batch(() => {
                        // store in the whitelist
                        dispatch(participantApproved(id, kind));

                        // remove from pending list
                        dispatch(dismissPendingParticipant(id, kind));
                    });
                });

            // this is received by moderators
            conference.on(
                JitsiConferenceEvents.AV_MODERATION_PARTICIPANT_REJECTED,
                ({ participant, kind }) => {
                    const { _id: id } = participant;

                    dispatch(participantRejected(id, kind));
                });

            // reset moderations
            conference.on(JitsiConferenceEvents.BREAKOUT_ROOMS_MOVE_TO_ROOM, roomId => {
                dispatch({ type: _RESET_MODERATIONS });
            });
        }
    });
