// @flow

import axios from 'axios';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { getCurrentConference } from '../base/conference';
import { isHost } from '../base/jwt';
import { StateListenerRegistry } from '../base/redux';
import { getAuthUrl } from '../../api/url';
import { updateSettings } from '../base/settings';

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

    // Only a moderator is allowed to send commands.
    if (!isHost(state)) {
        return;
    }

    const reqConfig = {
        headers: { Authorization: `Bearer ${process.env.VMEETING_API_TOKEN}`}
    };
    const apiBase = getAuthUrl(state);
    const { roomInfo: room } = state['features/base/conference'];
    axios.patch(`${apiBase}/conferences/${room._id}`, {
        face_detect: newSelectedValue
    }, reqConfig);
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

StateListenerRegistry.register(
    /* selector */ state => getCurrentConference(state),
    /* listener */ (conference, store) => {
        const receiveMessage = (_, data) => {
            // console.log('message is received:', data);
            const { type, ...payload } = data;
            switch (type) {
            case 'features/face-detect/update': {
                const { facedetect } = payload;
                const { aiAttentionAnalysisEnabled } = store.getState()['features/base/settings'];
                if (aiAttentionAnalysisEnabled !== facedetect) {
                    store.dispatch(updateSettings({
                        aiAttentionAnalysisEnabled: facedetect
                    }));
                }
            }
            }
        };

        if (conference) {
            conference.on(JitsiConferenceEvents.NON_PARTICIPANT_MESSAGE_RECEIVED, receiveMessage);
        }
    }
)
