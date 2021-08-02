// @flow

import { filter, flatten, keyBy, map, partition } from 'lodash';
import { getCurrentConference } from '../base/conference';
import { CONFERENCE_WILL_JOIN } from '../base/conference/actionTypes';
import {
    getParticipantById,
    getPinnedParticipant,
    isLocalParticipantModerator,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    pinParticipant,
    setParticipants
} from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { setFilmstripVisible } from '../filmstrip';
import { setTileView, setPagination } from '../video-layout';

import {
    setFollowMeModerator,
    setFollowMeState
} from './actions';
import { FOLLOW_ME_COMMAND } from './constants';
import { isFollowMeActive, isFollowMeEnabled } from './functions';
import logger from './logger';

import './subscriber';
import { getFollowMeState } from './subscriber';

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
 * control the user experience/interface (e.g. filmstrip visibility) of (other)
 * non-moderator participant.
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_WILL_JOIN: {
        const { conference } = action;

        conference.addCommandListener(
            FOLLOW_ME_COMMAND, ({ attributes, value }, id) => {
                _onFollowMeCommand(attributes, value, id, store);
            });
        break;
    }
    case PARTICIPANT_JOINED: {
        const state = store.getState();
        const conference = getCurrentConference(state);

        if (!action.participant.local &&
            isLocalParticipantModerator(state) &&
            isFollowMeEnabled(state))
        {
            setTimeout(() => {
                conference.sendCommand(
                    FOLLOW_ME_COMMAND,
                    { attributes: getFollowMeState(state) }
                );
            }, 3000);
        }
        break;
    }
    case PARTICIPANT_LEFT:
        if (store.getState()['features/follow-me'].moderator === action.participant.id) {
            store.dispatch(setFollowMeModerator());
        }
        break;
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
function _onFollowMeCommand(attributes = {}, value, id, store) {
    const state = store.getState();

    // We require to know who issued the command because (1) only a
    // moderator is allowed to send commands and (2) a command MUST be
    // issued by a defined commander.
    if (typeof id === 'undefined') {
        return;
    }

    const participantSendingCommand = getParticipantById(state, id);

    // The Command(s) API will send us our own commands and we don't want
    // to act upon them.
    if (participantSendingCommand.local) {
        return;
    }

    if (participantSendingCommand.role !== 'moderator') {
        logger.warn('Received follow-me command not from moderator');

        return;
    }

    // just a command that follow me was turned off
    if (attributes.off) {
        store.dispatch(setFollowMeModerator());

        return;
    }

    const { iAmRecorder } = state['features/base/config'];
    // if (attributes.sendToRecorder && !iAmRecorder) {
    //     return;
    // }

    if (!isFollowMeActive(state)) {
        store.dispatch(setFollowMeModerator(id));
    }

    const { state: oldState, value: oldValue } = state['features/follow-me'] || {};

    store.dispatch(setFollowMeState(attributes, value));

    // XMPP will translate all booleans to strings, so explicitly check against
    // the string form of the boolean {@code true}.
    if (oldState?.filmstripVisible !== attributes.filmstripVisible) {
        store.dispatch(setFilmstripVisible(attributes.filmstripVisible === 'true'));
    }

    if (oldState?.tileViewEnabled !== attributes.tileViewEnabled) {
        store.dispatch(setTileView(attributes.tileViewEnabled === 'true'));
    }

    // For now gate etherpad checks behind a web-app check to be extra safe
    // against calling a web-app global.
    if (typeof APP !== 'undefined'
        && oldState?.sharedDocumentVisible !== attributes.sharedDocumentVisible) {
        const isEtherpadVisible = attributes.sharedDocumentVisible === 'true';
        const documentManager = APP.UI.getSharedDocumentManager();
    
        if (documentManager
                && isEtherpadVisible !== state['features/etherpad'].editing) {
            documentManager.toggleEtherpad();
        }
    }

    const pinnedParticipant = getPinnedParticipant(state);
    const idOfParticipantToPin = attributes.nextOnStage;

    if (typeof idOfParticipantToPin !== 'undefined'
            && (!pinnedParticipant || idOfParticipantToPin !== pinnedParticipant.id)
            && oldState?.nextOnStage !== attributes.nextOnStage) {
        _pinVideoThumbnailById(store, idOfParticipantToPin);
    } else if (typeof idOfParticipantToPin === 'undefined' && pinnedParticipant) {
        store.dispatch(pinParticipant(null));
    }

    if (value && oldValue !== value) {
        const { data, ...pagination } = JSON.parse(value.replace(/&quot;/g, '"'));
        if (data && !iAmRecorder) {
            // 전달된 id 배열이 현재 참석자 목록과 상이할 경우,
            // 배열을 우선 배치하고 나머지는 뒷에 위치시킨다.
            const participants = store.getState()['features/base/participants'];
            const parts = partition(participants, p => data.includes(p.id));
            const mapData = keyBy(parts[0], 'id');
            store.dispatch(setParticipants(flatten([
                filter(map(data, id => mapData[id])),
                parts[1]
            ])));
        }
        // force repagination
        store.dispatch(setPagination({ order: pagination.order }, true));
    }
    // console.error('onFollowMeCommand:', attributes, value, id);
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
