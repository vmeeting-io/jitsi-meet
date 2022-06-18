// @flow

import UIEvents from '../../../service/UI/UIEvents';
import { getCurrentConference } from '../base/conference';
import { JitsiConferenceEvents, } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';

import { TOGGLE_WHITEBOARD } from './actionTypes';
import { setWhiteboardUrl } from './actions';
import { DISABLE_MODERATION, ENABLE_MODERATION } from '../av-moderation/actionTypes';
import { getLocalParticipant } from '../base/participants';
import { isForceMuted } from '../participants-pane/functions';
import { isEnabledFromState } from '../av-moderation/functions';

declare var APP: Object;

const WHITEBOARD_COMMAND = 'whiteboard';

/**
 * Middleware that captures actions related to collaborative whiteboard editing
 * and notifies components not hooked into redux.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    switch (action.type) {
    case TOGGLE_WHITEBOARD: {
        if (typeof APP !== 'undefined') {
            const result = next(action);
            APP.UI.emitEvent(UIEvents.WHITEBOARD_CLICKED);
            const state = getState();
            const { editing: visible } = state['features/whiteboard'];
            console.log('whiteboardVisible:', visible);
            const conference = getCurrentConference(state);

            try {
                conference && conference.sendEndpointMessage('', {
                    type: 'whiteboard',
                    visible
                });
            } catch (error) {
                logger.warn('Cannot send endpointMessage', error);
            }
            return result;
        }
        break;
    }
    }

    return next(action);
});

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, e.g. Clear messages or close the chat modal if it's left
 * open.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch, getState }, previousConference) => {
        const receiveMessage = (_, data) => {
            // console.log('message is received:', data);
            const { type, visible } = data || {};

            if (typeof APP !== 'undefined' && type === 'whiteboard') {
                const { editing } = getState()['features/whiteboard'];
                if (editing !== visible) {
                    APP.UI.emitEvent(UIEvents.WHITEBOARD_CLICKED);
                }
            }
        };

        if (conference) {
            conference.addCommandListener(WHITEBOARD_COMMAND,
                ({ value }) => {
                    let url;
                    const { whiteboard_base: whiteboardBase } = getState()['features/base/config'];

                    if (whiteboardBase) {
                        const u = new URL(value, whiteboardBase);

                        url = u.toString();
                    }

                    dispatch(setWhiteboardUrl(url));
                }
            );

            conference.on(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED, receiveMessage);
            conference.on(JitsiConferenceEvents.AV_MODERATION_CHANGED, ({ enabled, kind, actor }) => {
                if (typeof APP !== 'undefined' && kind === 'whiteboard') {
                    setTimeout(() => {
                        const state = getState();
                        const local = getLocalParticipant(state);
                        const approved = !isForceMuted(local, 'whiteboard', state);
                        
                        console.log(enabled, approved);
                        if (actor !== local.id && enabled !== approved) {
                            const whiteboardManager = APP.UI.getWhiteboardManager();
                            whiteboardManager.reload();
                        }
                    });
                }
            });
        }

        if (previousConference) {
            dispatch(setWhiteboardUrl(undefined));
        }
    });
