// @flow

import { getCurrentConference } from '../base/conference';
import { isLocalParticipantModerator } from '../base/participants';
import { StateListenerRegistry } from '../base/redux';

/**
 * Sends the face detect command, when a local property change occurs.
 *
 * @param {*} newSelectedValue - The changed selected value from the selector.
 * @param {Object} store - The redux store.
 * @private
 * @returns {void}
 */
const _sendCommand = function (newSelectedValue, store) {
    const state = store.getState();
    const conference = getCurrentConference(state);

    if (!conference) {
        return;
    }

    // Only a moderator is allowed to send commands.
    if (!isLocalParticipantModerator(state)) {
        return;
    }

    conference.faceDetectEnabled(newSelectedValue);
};

/**
 * Subscribes to changes to the Follow Me setting for the local participant to
 * notify remote participants of current user interface status.
 * Changing newSelectedValue param to off, when feature is turned of so we can
 * notify all listeners.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/settings'].aiAttentionAnalysisEnabled,
    /* listener */ (newSelectedValue, store) => _sendCommand(newSelectedValue, store));
