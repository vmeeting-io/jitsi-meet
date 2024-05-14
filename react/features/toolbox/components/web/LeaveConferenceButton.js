import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect, useDispatch, useSelector } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { leaveConference } from '../../../base/conference/actions';
import { grantModerator } from '../../../base/participants/actions';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';

import { HangupContextMenuItem } from './HangupContextMenuItem';

/**
 * Button to leave the conference.
 *
 * @param {Object} props - Component's props.
 * @returns {JSX.Element} - The leave conference button.
 */
export const LeaveConferenceButton = (props) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const participants = useSelector(state => state['features/filmstrip'].remoteParticipants);
    const moderatorCount = useSelector(state => state['features/base/participants'].moderators?.size || 0);

    const onLeaveConference = useCallback(async (e) => {
        sendAnalytics(createToolbarEvent('hangup'));
        if (participants.length === 1 || moderatorCount > 1) {
            if (moderatorCount === 1) {
                await dispatch(grantModerator(participants[0]));
            }
            dispatch(leaveConference());
        } else {
            e.stopPropagation();
            props.showSelectModerator?.();
        }
    }, [ dispatch, moderatorCount, participants ]);

    return (
        <HangupContextMenuItem
            accessibilityLabel = { t('toolbar.accessibilityLabel.leaveConference') }
            buttonKey = { props.buttonKey }
            buttonType = { BUTTON_TYPES.SECONDARY }
            label = { t('toolbar.leaveConference') }
            notifyMode = { props.notifyMode }
            onClick = { onLeaveConference } />
    );
};
