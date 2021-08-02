// @flow

import { map, throttle } from 'lodash';
import { getCurrentConference } from '../base/conference';
import { isHost } from '../base/jwt';
import {
    getLocalParticipant,
    getParticipants,
    getPinnedParticipant,
    isLocalParticipantModerator
} from '../base/participants';
import { StateListenerRegistry } from '../base/redux';
import { isRecording, isStreaming } from '../recording';
import { shouldDisplayTileView } from '../video-layout/functions';

import { FOLLOW_ME_COMMAND } from './constants';
import { isFollowMeEnabled } from './functions';

/**
 * Sends the follow-me command, when a local property change occurs.
 *
 * @param {*} newSelectedValue - The changed selected value from the selector.
 * @param {Object} store - The redux store.
 * @private
 * @returns {void}
 */
const _sendFollowMeCommand = throttle(
    function (newSelectedValue, store) { // eslint-disable-line no-unused-vars
    const state = store.getState();
    const conference = getCurrentConference(state);
    const { chatOnlyGuestEnabled, followMeEnabled } = state['features/base/config'];
    const isGuest = !isHost(state);
    const localParticipantId = getLocalParticipant(state)?.id;
    const forceSend = isRecording(state, localParticipantId) || isStreaming(state, localParticipantId);

    if (!conference) {
        return;
    }

    // Only a moderator is allowed to send commands.
    if (!isLocalParticipantModerator(state)) {
        return;
    }

    if (newSelectedValue === 'off') {
        // if the change is to off, local user turned off follow me and
        // we want to signal this

        conference.sendCommandOnce(
            FOLLOW_ME_COMMAND,
            { attributes: { off: true } }
        );

        return;
    } if (!forceSend && typeof followMeEnabled !== 'undefined') {
        if (!followMeEnabled) return;
    } else if (!forceSend && !state['features/base/conference'].followMeEnabled) {
        return;
    } else if (chatOnlyGuestEnabled && isGuest) {
        return;
    }

    const { pagination = {} } = state['features/video-layout'] || {};
    const participants = state['features/base/participants'];
    const data = map(participants, 'id');

    conference.sendCommand(
        FOLLOW_ME_COMMAND,
        {
            attributes: getFollowMeState(state),
            value: JSON.stringify({
                ...pagination,
                data
            })
        }
    );
}, 100);

/**
 * Subscribes to changes to the Follow Me setting for the local participant to
 * notify remote participants of current user interface status.
 * Changing newSelectedValue param to off, when feature is turned of so we can
 * notify all listeners.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/conference'].followMeEnabled,
    /* listener */ (newSelectedValue, store) => _sendFollowMeCommand(newSelectedValue || 'off', store));

/**
 * Subscribes to changes to the currently pinned participant in the user
 * interface of the local participant.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        const pinnedParticipant = getPinnedParticipant(state);

        return pinnedParticipant ? pinnedParticipant.id : null;
    },
    /* listener */ _sendFollowMeCommand);

/**
 * Subscribes to changes to the shared document (etherpad) visibility in the
 * user interface of the local participant.
 *
 * @param sharedDocumentVisible {Boolean} {true} if the shared document was
 * shown (as a result of the toggle) or {false} if it was hidden
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/etherpad'].editing,
    /* listener */ _sendFollowMeCommand);

/**
 * Subscribes to changes to the filmstrip visibility in the user interface of
 * the local participant.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/filmstrip'].visible,
    /* listener */ _sendFollowMeCommand);

/**
 * Subscribes to changes to the tile view setting in the user interface of the
 * local participant.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/video-layout'].tileViewEnabled,
    /* listener */ _sendFollowMeCommand);

/**
 * Subscribes to changes to the tile view order setting.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/video-layout'].pagination,
    /* listener */ _sendFollowMeCommand);

/**
 * Subscribes to changes to the tile view order setting.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        const participants = getParticipants(state);
        return map(participants, 'id');
    },
    /* listener */ _sendFollowMeCommand);

/**
 * selector for returning state from redux that should be respected by
 * other participants while follow me is enabled.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
export function getFollowMeState(state) {
    const pinnedParticipant = getPinnedParticipant(state);
    const followMeState = {
        filmstripVisible: state['features/filmstrip'].visible,
        nextOnStage: pinnedParticipant && pinnedParticipant.id,
        sharedDocumentVisible: state['features/etherpad'].editing,
        tileViewEnabled: shouldDisplayTileView(state)
    };

    // mark sendToRecorder, if followMe is disabled and jibri is running
    // if (!isFollowMeEnabled(state) &&
    //     (isRecording(state, true) || isStreaming(state, true))) {
    //     followMeState.sendToRecorder = true;
    // }

    // console.error('getFollowMeState:', followMeState);
    return followMeState;
}
