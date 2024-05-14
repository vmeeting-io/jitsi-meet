import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { endConference } from '../../../base/conference/actions';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';
import { isInBreakoutRoom } from '../../../breakout-rooms/functions';
import { LeaveButton } from '../../../participants-pane/components/breakout-rooms/components/web/LeaveButton';

import { HangupContextMenuItem } from './HangupContextMenuItem';

/**
 * Button to end the conference for all participants.
 *
 * @param {Object} props - Component's props.
 * @returns {JSX.Element} - The end conference button.
 */
export const EndConferenceButton = (props) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const _isLocalParticipantModerator = useSelector(isLocalParticipantModerator);
    const _isInBreakoutRoom = useSelector(isInBreakoutRoom);

    const onEndConference = useCallback(() => {
        dispatch(endConference());
    }, [ dispatch ]);

    if (_isInBreakoutRoom) {
        return <LeaveButton />;
    }

    return (<>
        { _isLocalParticipantModerator &&
            <HangupContextMenuItem
                accessibilityLabel = { t('toolbar.accessibilityLabel.endConference') }
                buttonKey = { props.buttonKey }
                buttonType = { BUTTON_TYPES.DESTRUCTIVE }
                label = { t('toolbar.endConference') }
                notifyMode = { props.notifyMode }
                onClick = { onEndConference } /> }
    </>);
};
