// @flow

import { CONFERENCE_JOIN_IN_PROGRESS } from '../base/conference/actionTypes';
import { setFollowMe } from '../base/conference/actions';
import { JitsiConferenceEvents, JitsiRecordingConstants } from '../base/lib-jitsi-meet';
import { PARTICIPANT_LEFT } from '../base/participants/actionTypes';
import { pinParticipant } from '../base/participants/actions';
import { getLocalParticipant, getParticipantById, getPinnedParticipant } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { updateSettings } from '../base/settings/actions';
import { addStageParticipant, removeStageParticipant, setFilmstripVisible } from '../filmstrip/actions';
import { RECORDING_SESSION_UPDATED } from '../recording/actionTypes';
import { getResourceId, getSessionById } from '../recording/functions';
import { setTileView } from '../video-layout/actions';

import {
    setFollowMeModerator,
    setFollowMeState
} from './actions';
import { FOLLOW_ME_COMMAND, GRANT_FOLLOW_ME_MODERATOR } from './constants';
import { isFollowMeActive, isFollowMeEnabled } from './functions';
import logger from './logger';

import './subscriber';

declare var APP: Object;

/**
 * The timeout after which a follow-me command that has been received will be
 * ignored if not consumed.
 *
 * @type {number} in seconds
 * @private
 */
const _FOLLOW_ME_RECEIVED_TIMEOUT = 30;

/**
 * An instance of a timeout used as a workaround when attempting to pin a
 * non-existent particapant, which may be caused by participant join information
 * not being received yet.
 *
 * @type {TimeoutID}
 */
let nextOnStageTimeout;

/**
 * A count of how many seconds the nextOnStageTimeout has ticked while waiting
 * for a participant to be discovered that should be pinned. This variable
 * works in conjunction with {@code _FOLLOW_ME_RECEIVED_TIMEOUT} and
 * {@code nextOnStageTimeout}.
 *
 * @type {number}
 */
let nextOnStageTimer = 0;

/**
 * Represents "Follow Me" feature which enables a moderator to (partially)
 * control the user experience/interface (e.g. Filmstrip visibility) of (other)
 * non-moderator participant.
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_JOIN_IN_PROGRESS: {
        const { conference } = action;

        conference.addCommandListener(
            FOLLOW_ME_COMMAND, ({ attributes }, id) => {
                _onFollowMeCommand(attributes, id, store);
            });

        conference.on(
            JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
            (_, data) => {
                const { type, id, enabled } = data;
                if (type === GRANT_FOLLOW_ME_MODERATOR) {
                    // console.log('grant-follow-me-moderator received:', id, enabled);
                    store.dispatch(setFollowMe(enabled));
                }
            });

        break;
    }
    case PARTICIPANT_LEFT:
        if (store.getState()['features/follow-me'].moderator === action.participant.id) {
            store.dispatch(setFollowMeModerator());
        }
        break;
    case RECORDING_SESSION_UPDATED: {
        const oldSessionData = getSessionById(store.getState(), action.sessionData.id);

        const result = next(action);
        const state = store.getState();
        const { iAmRecorder, iAmSipGateway } = state['features/base/config'];
        const localParticipant = getLocalParticipant(state);

        if (iAmRecorder && !iAmSipGateway) {
            return result;
        }

        const updatedSessionData = getSessionById(state, action.sessionData.id);
        const initiatorId = getResourceId(updatedSessionData.initiator);
        const { OFF, ON } = JitsiRecordingConstants.status;

        if (initiatorId !== localParticipant.id) {
            return result;
        }

        // if follow-me is not active, set followMe true
        if (!isFollowMeActive(state)
            && updatedSessionData.status === ON
            && (!oldSessionData || oldSessionData.status !== ON)) {
            store.dispatch(setFollowMe(true));
        } else if (isFollowMeEnabled(state)
            && updatedSessionData.status === OFF
            && (!oldSessionData || oldSessionData.status !== OFF)) {
            store.dispatch(setFollowMe(false));
        }

        return result;
    }
    }
    return next(action);
});

/**
 * Notifies this instance about a "Follow Me" command received by the Jitsi
 * conference.
 *
 * @param {Object} attributes - The attributes carried by the command.
 * @param {string} id - The identifier of the participant who issuing the
 * command. A notable idiosyncrasy to be mindful of here is that the command
 * may be issued by the local participant.
 * @param {Object} store - The redux store. Used to calculate and dispatch
 * updates.
 * @private
 * @returns {void}
 */
function _onFollowMeCommand(attributes = {}, id, store) {
    const state = store.getState();

    console.log('onFollowMeCommand:', attributes);

    // console.log('onFollowMeCommand:', id, attributes);
    // We require to know who issued the command because (1) only a
    // moderator is allowed to send commands and (2) a command MUST be
    // issued by a defined commander.
    if (typeof id === 'undefined') {
        return;
    }

    const participantSendingCommand = getParticipantById(state, id);

    if (participantSendingCommand) {
        // The Command(s) API will send us our own commands and we don't want
        // to act upon them.
        if (participantSendingCommand.local) {
            return;
        }
    
        if (participantSendingCommand.role !== 'moderator') {
            logger.warn('Received follow-me command not from moderator');
    
            return;
        }
    } else {
        // This is the case of jibri receiving commands from a hidden participant.
        const { iAmRecorder } = state['features/base/config'];
        const { conference } = state['features/base/conference'];

        // As this participant is not stored in redux store we do the checks on the JitsiParticipant from lib-jitsi-meet
        const participant = conference?.getParticipantById(id);

        if (!iAmRecorder || !participant || participant.getRole() !== 'moderator'
            || !participant.isHiddenFromRecorder()) {
            logger.warn('Something went wrong with follow-me command');

            return;
        }
    }

    if (!isFollowMeActive(state) || state['features/follow-me'].moderator !== id) {
        store.dispatch(setFollowMeModerator(id));
    }

    // just a command that follow me was turned off
    if (attributes.off) {
        store.dispatch(setFollowMeModerator());

        return;
    }

    const oldState = state['features/follow-me'].state || {};

    store.dispatch(setFollowMeState(attributes));

    // XMPP will translate all booleans to strings, so explicitly check against
    // the string form of the boolean {@code true}.
    if (oldState.filmstripVisible !== attributes.filmstripVisible) {
        store.dispatch(setFilmstripVisible(attributes.filmstripVisible === 'true'));
    }

    if (oldState.tileViewEnabled !== attributes.tileViewEnabled) {
        store.dispatch(setTileView(attributes.tileViewEnabled === 'true'));
    }

    // For now gate whiteboard checks behind a web-app check to be extra safe
    // against calling a web-app global.
    if (typeof APP !== 'undefined'
        && oldState.whiteboardVisible !== attributes.whiteboardVisible) {
        const isWhiteboardVisible = attributes.whiteboardVisible === 'true';
        const whiteboardManager = APP.UI.getWhiteboardManager();

        if (whiteboardManager
                && isWhiteboardVisible !== state['features/whiteboard'].editing) {
            whiteboardManager.toggleWhiteboard();
        }
    }

    const pinnedParticipant = getPinnedParticipant(state);
    const idOfParticipantToPin = attributes.nextOnStage;

    if (typeof idOfParticipantToPin !== 'undefined'
            && (!pinnedParticipant || idOfParticipantToPin !== pinnedParticipant.id)
            && oldState.nextOnStage !== attributes.nextOnStage) {
        _pinVideoThumbnailById(store, idOfParticipantToPin);
    } else if (typeof idOfParticipantToPin === 'undefined' && pinnedParticipant) {
        store.dispatch(pinParticipant(null));
    }

    if (attributes.pinnedStageParticipants !== undefined) {
        const stageParticipants = JSON.parse(attributes.pinnedStageParticipants);
        let oldStageParticipants = [];

        if (oldState.pinnedStageParticipants !== undefined) {
            oldStageParticipants = JSON.parse(oldState.pinnedStageParticipants);
        }

        if (!_.isEqual(stageParticipants, oldStageParticipants)) {
            const toRemove = _.differenceWith(oldStageParticipants, stageParticipants, _.isEqual);
            const toAdd = _.differenceWith(stageParticipants, oldStageParticipants, _.isEqual);

            toRemove.forEach((p) =>
                store.dispatch(removeStageParticipant(p.participantId)));
            toAdd.forEach((p) =>
                store.dispatch(addStageParticipant(p.participantId, true)));
        }
    }

    if (attributes.maxStageParticipants !== undefined
        && oldState.maxStageParticipants !== attributes.maxStageParticipants) {
        store.dispatch(updateSettings({
            maxStageParticipants: Number(attributes.maxStageParticipants)
        }));
    }
}

/**
 * Pins the video thumbnail given by clickId.
 *
 * @param {Object} store - The redux store.
 * @param {string} clickId - The identifier of the participant to pin.
 * @private
 * @returns {void}
 */
function _pinVideoThumbnailById(store, clickId) {
    if (getParticipantById(store.getState(), clickId)) {
        clearTimeout(nextOnStageTimeout);
        nextOnStageTimer = 0;

        store.dispatch(pinParticipant(clickId));
    } else {
        nextOnStageTimeout = setTimeout(() => {
            if (nextOnStageTimer > _FOLLOW_ME_RECEIVED_TIMEOUT) {
                nextOnStageTimer = 0;

                return;
            }

            nextOnStageTimer++;

            _pinVideoThumbnailById(store, clickId);
        }, 1000);
    }
}
