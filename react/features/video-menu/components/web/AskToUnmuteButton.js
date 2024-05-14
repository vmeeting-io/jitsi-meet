// @flow

import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { approveParticipant } from '../../../av-moderation/actions';
import { IconMic, IconVideo } from '../../../base/icons/svg';
import { MEDIA_TYPE, MediaType } from '../../../base/media/constants';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';


/**
 * Implements a React {@link Component} which displays a button that
 * allows the moderator to request from a participant to mute themselves.
 *
 * @returns {JSX.Element}
 */
const AskToUnmuteButton = ({
    buttonType,
    notifyMode,
    notifyClick,
    participantID
}) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const _onClick = useCallback(() => {
        notifyClick?.();
        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }
        if (buttonType === MEDIA_TYPE.AUDIO) {
            dispatch(approveParticipant(participantID, MEDIA_TYPE.AUDIO));
        } else if (buttonType === MEDIA_TYPE.VIDEO) {
            dispatch(approveParticipant(participantID, MEDIA_TYPE.VIDEO));
        }
    }, [ buttonType, dispatch, notifyClick, notifyMode, participantID ]);

    const text = useMemo(() => {
        if (buttonType === MEDIA_TYPE.AUDIO) {
            return t('participantsPane.actions.askUnmute');
        } else if (buttonType === MEDIA_TYPE.VIDEO) {
            return t('participantsPane.actions.allowVideo');
        }

        return '';
    }, [ buttonType ]);

    const icon = useMemo(() => {
        if (buttonType === MEDIA_TYPE.AUDIO) {
            return IconMic;
        } else if (buttonType === MEDIA_TYPE.VIDEO) {
            return IconVideo;
        }
    }, [ buttonType ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { text }
            icon = { icon }
            onClick = { _onClick }
            testId = { `unmute-${buttonType}-${participantID}` }
            text = { text } />
    );
};

export default AskToUnmuteButton;
