import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { approveParticipant } from '../../../av-moderation/actions';
import { MEDIA_TYPE } from '../../../base/media/constants';
import Button from '../../../base/ui/components/web/Button';
import { QUICK_ACTION_BUTTON } from '../../constants';

const useStyles = makeStyles()(theme => {
    return {
        button: {
            marginRight: theme.spacing(2)
        }
    };
});

const ParticipantQuickAction = ({
    buttonType,
    muteAudio,
    participantID,
    participantName,
    stopVideo
}) => {
    const { classes: styles } = useStyles();
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const askToUnmute = useCallback(() => {
        dispatch(approveParticipant(participantID, MEDIA_TYPE.AUDIO));
    }, [ dispatch, participantID ]);

    const allowVideo = useCallback(() => {
        dispatch(approveParticipant(participantID, MEDIA_TYPE.VIDEO));
    }, [ dispatch, participantID ]);

    switch (buttonType) {
    case QUICK_ACTION_BUTTON.MUTE: {
        return (
            <Button
                accessibilityLabel = { `${t('participantsPane.actions.mute')} ${participantName}` }
                className = { styles.button }
                label = { t('participantsPane.actions.mute') }
                onClick = { muteAudio(participantID) }
                size = 'small'
                testId = { `mute-audio-${participantID}` } />
        );
    }
    case QUICK_ACTION_BUTTON.ASK_TO_UNMUTE: {
        return (
            <Button
                accessibilityLabel = { `${t('participantsPane.actions.askUnmute')} ${participantName}` }
                className = { styles.button }
                label = { t('participantsPane.actions.askUnmute') }
                onClick = { askToUnmute }
                size = 'small'
                testId = { `unmute-audio-${participantID}` } />
        );
    }
    case QUICK_ACTION_BUTTON.ALLOW_VIDEO: {
        return (
            <Button
                accessibilityLabel = { `${t('participantsPane.actions.askUnmute')} ${participantName}` }
                className = { styles.button }
                label = { t('participantsPane.actions.allowVideo') }
                onClick = { allowVideo }
                size = 'small'
                testId = { `unmute-video-${participantID}` } />
        );
    }
    case QUICK_ACTION_BUTTON.STOP_VIDEO: {
        return (
            <Button
                accessibilityLabel = { `${t('participantsPane.actions.mute')} ${participantName}` }
                className = { styles.button }
                label = { t('participantsPane.actions.stopVideo') }
                onClick = { stopVideo(participantID) }
                size = 'small'
                testId = { `mute-video-${participantID}` } />
        );
    }
    default: {
        return null;
    }
    }
};

export default ParticipantQuickAction;
