// @flow
import { appNavigate } from '../app/actions';
import {
    CONFERENCE_JOINED,
    KICKED_OUT,
    PARTICIPANT_CHAT_DISABLED,
    PARTICIPANT_CHAT_ENABLED,
    getCurrentConference
} from '../base/conference';
import { disconnect } from '../base/connection';
import { hideDialog, isDialogOpen } from '../base/dialog';
import { browser } from '../base/lib-jitsi-meet';
import { setActiveModalId } from '../base/modal';
import { getParticipantById, getParticipantDisplayName, participantUpdated, pinParticipant } from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { SET_REDUCED_UI } from '../base/responsive-ui';
import { FeedbackDialog } from '../feedback';
import { setFilmstripEnabled } from '../filmstrip';
import { saveErrorNotification } from '../notifications';
import { setToolboxEnabled } from '../toolbox/actions';

import { 
    notifyChatDisabled,
    notifyChatEnabled
} from './actions';

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_JOINED:
    case SET_REDUCED_UI: {
        const { dispatch, getState } = store;
        const state = getState();
        const { reducedUI } = state['features/base/responsive-ui'];

        dispatch(setToolboxEnabled(!reducedUI));
        dispatch(setFilmstripEnabled(!reducedUI));

        break;
    }

    case KICKED_OUT: {
        const { dispatch, getState } = store;

        const args = {
            participantDisplayName:
                getParticipantDisplayName(getState, action.participant.getId())
        };
        dispatch(saveErrorNotification({
            descriptionKey: 'dialog.kickTitle',
            descriptionArguments: args,
            titleKey: 'dialog.sessTerminated',
        }));

        if (browser.isReactNative()) {
            dispatch(appNavigate(undefined));
        } else {
            dispatch(disconnect(false));
        }
        break;
    }

    case PARTICIPANT_CHAT_DISABLED: {
        const { dispatch, getState } = store;
        const participant = getParticipantById(getState(), action.participant);
        if (typeof participant.chat === 'undefined') {
            dispatch(participantUpdated({
                id: participant.id,
                chat: false,
            }));
        } else {
            dispatch(notifyChatDisabled(
                action.participant
            ));
        }
        break;
    }

    case PARTICIPANT_CHAT_ENABLED: {
        const { dispatch, getState } = store;
        const participant = getParticipantById(getState(), action.participant);
        if (typeof participant.chat === 'undefined') {
            dispatch(participantUpdated({
                id: participant.id,
                chat: true,
            }));
        } else {
            dispatch(notifyChatEnabled(
                action.participant
            ));
        }
        break;
    }
    }

    return result;
});

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, close all dialogs and unpin any pinned participants.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch, getState }, prevConference) => {
        const { authRequired, membersOnly, passwordRequired }
            = getState()['features/base/conference'];

        if (conference !== prevConference) {
            // Unpin participant, in order to avoid the local participant
            // remaining pinned, since it's not destroyed across runs.
            dispatch(pinParticipant(null));

            // XXX I wonder if there is a better way to do this. At this stage
            // we do know what dialogs we want to keep but the list of those
            // we want to hide is a lot longer. Thus we take a bit of a shortcut
            // and explicitly check.
            if (typeof authRequired === 'undefined'
                    && typeof passwordRequired === 'undefined'
                    && typeof membersOnly === 'undefined'
                    && !isDialogOpen(getState(), FeedbackDialog)) {
                // Conference changed, left or failed... and there is no
                // pending authentication, nor feedback request, so close any
                // dialog we might have open.
                dispatch(hideDialog());
            }

            // We want to close all modals.
            dispatch(setActiveModalId());
        }
    });
