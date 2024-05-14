// @flow

import { batch } from 'react-redux';

import UIEvents from '../../../service/UI/UIEvents';
import { sendAnalytics } from '../analytics/functions';
import { createOpenWhiteboardEvent } from '../analytics/AnalyticsEvents';
import { UPDATE_CONFERENCE_METADATA } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import { setRoomInfo } from '../base/conference/actions';
import { JitsiConferenceEvents, } from '../base/lib-jitsi-meet';
import {
    PARTICIPANT_ROLE,
    PARTICIPANT_UPDATED,
    getParticipantById,
    getLocalParticipant
} from '../base/participants';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { SETTINGS_UPDATED } from '../base/settings/actionTypes';
import { isForceMuted } from '../participants-pane/functions';

import { SET_WHITEBOARD_OPEN, TOGGLE_WHITEBOARD } from './actionTypes';
import {
    notifyWhiteboardLimit,
    resetWhiteboard,
    restrictWhiteboard,
    setWhiteboardOpen,
    setWhiteboardUrl,
    setupWhiteboard,
    toggleWhiteboard
} from './actions';
import { WHITEBOARD_ID } from './constants';
import {
    isWhiteboardOpen,
    shouldEnforceUserLimit,
    shouldNotifyUserLimit
} from './functions';

declare var APP: Object;

const WHITEBOARD_COMMAND = 'whiteboard';

MiddlewareRegistry.register(store => next => action => {
    const state = store.getState();

    switch (action.type) {
    case SET_WHITEBOARD_OPEN: {
        const enforceUserLimit = shouldEnforceUserLimit(state);
        const notifyUserLimit = shouldNotifyUserLimit(state);

        if (action.isOpen && !enforceUserLimit && !notifyUserLimit) {
            sendAnalytics(createOpenWhiteboardEvent());

            return next(action);
        }

        break;
    }

    case UPDATE_CONFERENCE_METADATA: {
        const { metadata } = action;

        if (metadata?.[WHITEBOARD_ID]) {
            store.dispatch(setupWhiteboard({
                collabDetails: metadata[WHITEBOARD_ID].collabDetails
            }));
            store.dispatch(setWhiteboardOpen(true));
        }

        break;
    }
    case TOGGLE_WHITEBOARD: {
        if (typeof APP !== 'undefined') {
            APP.UI.emitEvent(UIEvents.WHITEBOARD_CLICKED);
        }
        break;
    }
    case PARTICIPANT_UPDATED: {
        const { id, role } = action.participant;
        const localParticipant = getLocalParticipant(state);

        if (localParticipant?.id !== id) {
            return next(action);
        }

        const oldParticipant = getParticipantById(state, id);
        const oldRole = oldParticipant?.role;

        if (typeof APP !== 'undefined'
            && oldRole
            && oldRole !== role
            && role === PARTICIPANT_ROLE.MODERATOR)
        {
            const result = next(action);
            const whiteboardManager = APP.UI.getWhiteboardManager();
            if (whiteboardManager && whiteboardManager.isOpen) {
                whiteboardManager.reload();
            }
            return result;
        }
        break;
    }
    case SETTINGS_UPDATED: {
        const state = store.getState();
        if (typeof APP !== 'undefined'
            && action.settings.hasOwnProperty('displayName')
            && state['features/base/settings'].displayName !== action.settings.displayName)
        {
            const result = next(action);
            const whiteboardManager = APP.UI.getWhiteboardManager();
            if (whiteboardManager && whiteboardManager.isOpen) {
                whiteboardManager.reload();
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
            const { type, ...whiteboard } = data || {};

            if (typeof APP !== 'undefined' && type === 'whiteboard') {
                /*
                 * Delay show toggle whiteboard
                 * largeVideoContainer hide : 300ms + alpha
                 * tileViewContainer show : 300ms + alpha
                 */
                setTimeout(() => {
                    const state = getState();
                    const { roomInfo } = state['features/base/conference'];
                    const { editing } = state['features/whiteboard'];
                    const whiteboardManager = APP.UI.getWhiteboardManager();
                    const newWhiteboard = { ...(roomInfo.whiteboard || {}), ...whiteboard };

                    if (editing !== Boolean(whiteboard.owner)) {
                        batch(() => {
                            dispatch(setRoomInfo({ ...roomInfo, whiteboard: newWhiteboard }));
                            dispatch(toggleWhiteboard());
                        });
                    } else if (whiteboardManager
                        && whiteboardManager.isOpen
                        && roomInfo.whiteboard?.userVisible !== whiteboard.userVisible)
                    {
                        dispatch(setRoomInfo({ ...roomInfo, whiteboard: newWhiteboard }));
                        whiteboardManager.reload();
                    }
                }, 2000);
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

                    console.log('WHITEBOARD_COMMAND:', value);
                    dispatch(setWhiteboardUrl(url));
                }
            );

            conference.on(JitsiConferenceEvents.NON_PARTICIPANT_MESSAGE_RECEIVED, receiveMessage);
            conference.on(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED, receiveMessage);
            conference.on(JitsiConferenceEvents.AV_MODERATION_CHANGED, ({ enabled, kind, actor }) => {
                if (typeof APP !== 'undefined' && kind === 'whiteboard') {
                    setTimeout(() => {
                        const state = getState();
                        const local = getLocalParticipant(state);
                        const approved = !isForceMuted(local, 'whiteboard', state);
                        
                        // console.log(enabled, approved);
                        if (actor !== local.id && enabled !== approved) {
                            const whiteboardManager = APP.UI.getWhiteboardManager();
                            whiteboardManager.reload();
                        }
                    });
                }
            });
        }

        if (conference !== previousConference) {
            dispatch(setWhiteboardUrl(undefined));
            // dispatch(resetWhiteboard());
        }
    });

/**
 * Set up state change listener to limit whiteboard access.
 */
StateListenerRegistry.register(
    state => shouldEnforceUserLimit(state),
    (enforceUserLimit, { dispatch, getState }): void => {
        if (isWhiteboardOpen(getState()) && enforceUserLimit) {
            dispatch(restrictWhiteboard());
        }
    }
);

/**
 * Set up state change listener to notify about whiteboard usage.
 */
StateListenerRegistry.register(
    state => shouldNotifyUserLimit(state),
    (notifyUserLimit, { dispatch, getState }, prevNotifyUserLimit): void => {
        if (isWhiteboardOpen(getState()) && notifyUserLimit && !prevNotifyUserLimit) {
            dispatch(notifyWhiteboardLimit());
        }
    }
);
