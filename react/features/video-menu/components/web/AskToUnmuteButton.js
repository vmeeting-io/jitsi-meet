// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { approveParticipant } from '../../../av-moderation/actions';
import ContextMenuItem from '../../../base/components/context-menu/ContextMenuItem';
import { IconCamera, IconMicrophoneEmpty } from '../../../base/icons';
import { MEDIA_TYPE } from '../../../base/media';

type Props = {

    /**
     * Whether or not the participant is audio muted.
     */
    isAudioMuted: boolean,

    /**
     * Whether or not the participant is video muted.
     */
    isVideoMuted: boolean,

    /**
     * The ID for the participant on which the button will act.
     */
    participantID: string
}

const AskToUnmuteButton = ({ isAudioMuted, isVideoMuted, participantID }: Props) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const _onClick = useCallback(() => {
        if (isAudioMuted) {
            dispatch(approveParticipant(participantID, MEDIA_TYPE.AUDIO));
        } else if (isVideoMuted) {
            dispatch(approveParticipant(participantID, MEDIA_TYPE.VIDEO));
        }
    }, [ participantID, isAudioMuted ]);

    if (!isAudioMuted && !isVideoMuted) {
        return null;
    }

    const text = isAudioMuted
        ? t('participantsPane.actions.askUnmute')
        : t('participantsPane.actions.allowVideo');

    const icon = isAudioMuted ? IconMicrophoneEmpty : IconCamera;

    return (
        <ContextMenuItem
            accessibilityLabel = { text }
            icon = { icon }
            onClick = { _onClick }
            text = { text } />
    );
};

export default AskToUnmuteButton;
