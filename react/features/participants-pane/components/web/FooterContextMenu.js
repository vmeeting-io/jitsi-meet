// @flow

import { makeStyles } from '@material-ui/core/styles';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import {
    requestDisableModeration,
    requestEnableModeration,
} from '../../../av-moderation/actions';
import {
    isEnabled as isAvModerationEnabled,
    isSupported as isAvModerationSupported
} from '../../../av-moderation/functions';
import { isStartCountDown } from '../../../base/conference';
import { ContextMenu, ContextMenuItemGroup } from '../../../base/components';
import { openDialog } from '../../../base/dialog';
import {
    IconAnnouncement,
    IconCheck,
    IconHorizontalPoints,
    IconStopWatch,
    IconVideoOff,
} from '../../../base/icons';
import {
    getLocalParticipant,
    getParticipantCount,
    isEveryoneModerator
} from '../../../base/participants';
import { selectParticipantDisplayName } from '../../../base/participants/selectors';
import { openSettingsDialog, SETTINGS_TABS } from '../../../settings';
import { getTimerStarted } from '../../../timer/functions';
import { MuteEveryonesVideoDialog } from '../../../video-menu/components';

import {
    notifyRandomSelectionStarted,
    notifyRandomSelectionCompleted,
} from '../../actions.any';
import { randomlySelectFromAllParticipants } from '../../selectors';

import { TimerDialog, TimerCancelDialog } from '.'


const useStyles = makeStyles(theme => {
    return {
        contextMenu: {
            bottom: 'auto',
            margin: '0',
            right: 0,
            top: '-8px',
            transform: 'translateY(-100%)',
            width: '283px'
        },

        text: {
            color: theme.palette.text02,
            padding: '10px 16px',
            height: '40px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box'
        },

        indentedLabel: {
            '& > span': {
                marginLeft: '36px'
            }
        }
    };
});

type Props = {

    /**
     * Whether the menu is open.
     */
    isOpen: boolean,

    /**
     * Drawer close callback.
     */
    onDrawerClose: Function,

    /**
     * Callback for the mouse leaving this item.
     */
    onMouseLeave?: Function
};

export const FooterContextMenu = ({ isOpen, onDrawerClose, onMouseLeave }: Props) => {
    const dispatch = useDispatch();
    const isModerationSupported = useSelector(isAvModerationSupported());
    const allModerators = useSelector(isEveryoneModerator);
    const isAudioModerationEnabled = useSelector(isAvModerationEnabled('audio'));
    const isVideoModerationEnabled = useSelector(isAvModerationEnabled('video'));
    const isChatModerationEnabled = useSelector(isAvModerationEnabled('chat'));
    const isPollModerationEnabled = useSelector(isAvModerationEnabled('poll'));
    const isNameModerationEnabled = useSelector(isAvModerationEnabled('name'));
    const { id } = useSelector(getLocalParticipant);
    const timerStarted = useSelector(getTimerStarted);
    const participantCount = useSelector(getParticipantCount);
    const initiator = useSelector(selectParticipantDisplayName(id));
    const isRandomSelectionRunning = useSelector(isStartCountDown);
    const randomselectionClass = isRandomSelectionRunning ? classes.menudisabled : '';
    const randomParticipantID = useSelector(randomlySelectFromAllParticipants);

    // randomly selects a participant from allParticipants and get its display name
    const selectedParticipantDisplayName = useSelector(selectParticipantDisplayName(randomParticipantID));

    const { t } = useTranslation();

    const disableAudioModeration = useCallback(() => dispatch(requestDisableModeration('audio')), [dispatch]);
    const disableVideoModeration = useCallback(() => dispatch(requestDisableModeration('video')), [dispatch]);
    const disableChatModeration = useCallback(() => dispatch(requestDisableModeration('chat')), [dispatch]);
    const disablePollModeration = useCallback(() => dispatch(requestDisableModeration('poll')), [dispatch]);
    const disableNameModeration = useCallback(() => dispatch(requestDisableModeration('name')), [dispatch]);

    const enableAudioModeration = useCallback(() => dispatch(requestEnableModeration('audio')), [dispatch]);
    const enableVideoModeration = useCallback(() => dispatch(requestEnableModeration('video')), [dispatch]);
    const enableChatModeration = useCallback(() => dispatch(requestEnableModeration('chat')), [dispatch]);
    const enablePollModeration = useCallback(() => dispatch(requestEnableModeration('poll')), [dispatch]);
    const enableNameModeration = useCallback(() => dispatch(requestEnableModeration('name')), [dispatch]);

    const classes = useStyles();

    const muteAllVideo = useCallback(
        () => dispatch(openDialog(MuteEveryonesVideoDialog)), [dispatch]);

    const openModeratorSettings = () => dispatch(openSettingsDialog(SETTINGS_TABS.MODERATOR));

    const startRandomSelection = useCallback(
        () => {
            // function that notifies random selection procedure has now started
            dispatch(notifyRandomSelectionStarted(initiator));

            // toggling of menu option is also being handled by 'onMouseLeave' which toggles the display menu
            // thus, we use the existing function to imitate action to hide the menu option after the option was clicked
            onMouseLeave();

            // set a timeout of 5 seconds before executing rest of the code
            setTimeout(function () {
                // notify the selection of participant and propagate randomParticipantID which will be used during pinning the participant
                dispatch(notifyRandomSelectionCompleted(selectedParticipantDisplayName, randomParticipantID));
            }, 5000);

        }
    )

    const _onStartTimerClick = useCallback(
        () => {
            dispatch(openDialog(TimerDialog, { initiator: initiator }))
        }
    );

    const _onEndTimerClick = useCallback(
        () => {
            dispatch(openDialog(TimerCancelDialog, { initiator: initiator }))
        }
    );

    const actions = [];

    if (participantCount >= 3) {
        // for random selection
        actions.push({
            accessibilityLabel: t('participantsPane.actions.startRandomSelection'),
            className: randomselectionClass,
            id: 'participants-pane-context-menu-random-selection',
            icon: IconAnnouncement,
            iconSize: 18,
            onClick: startRandomSelection,
            text: t('participantsPane.actions.startRandomSelection')
        });
    }
    if (participantCount > 1) {
        const label = t(timerStarted ? 'participantsPane.actions.stopTimer' : 'participantsPane.actions.startTimerLabel');
        actions.push({
            accessibilityLabel: label,
            id: 'participants-pane-context-menu-timer',
            icon: IconStopWatch,
            iconSize: 18,
            onClick: timerStarted ? _onEndTimerClick : _onStartTimerClick,
            text: label
        });
    }

    const moderationActions = [
        {
            accessibilityLabel: t('participantsPane.actions.audioModeration'),
            className: isAudioModerationEnabled ? classes.indentedLabel : '',
            id: isAudioModerationEnabled
                ? 'participants-pane-context-menu-stop-audio-moderation'
                : 'participants-pane-context-menu-start-audio-moderation',
            icon: !isAudioModerationEnabled && IconCheck,
            onClick: isAudioModerationEnabled ? disableAudioModeration : enableAudioModeration,
            text: t('participantsPane.actions.audioModeration')
        }, {
            accessibilityLabel: t('participantsPane.actions.videoModeration'),
            className: isVideoModerationEnabled ? classes.indentedLabel : '',
            id: isVideoModerationEnabled
                ? 'participants-pane-context-menu-stop-video-moderation'
                : 'participants-pane-context-menu-start-video-moderation',
            icon: !isVideoModerationEnabled && IconCheck,
            onClick: isVideoModerationEnabled ? disableVideoModeration : enableVideoModeration,
            text: t('participantsPane.actions.videoModeration')
        }, {
            accessibilityLabel: t('participantsPane.actions.chatModeration'),
            className: isChatModerationEnabled ? classes.indentedLabel : '',
            id: isChatModerationEnabled
                ? 'participants-pane-context-menu-stop-chat-moderation'
                : 'participants-pane-context-menu-start-chat-moderation',
            icon: !isChatModerationEnabled && IconCheck,
            onClick: isChatModerationEnabled ? disableChatModeration : enableChatModeration,
            text: t('participantsPane.actions.chatModeration')
        }, {
            accessibilityLabel: t('participantsPane.actions.pollModeration'),
            className: isPollModerationEnabled ? classes.indentedLabel : '',
            id: isPollModerationEnabled
                ? 'participants-pane-context-menu-stop-poll-moderation'
                : 'participants-pane-context-menu-start-poll-moderation',
            icon: !isPollModerationEnabled && IconCheck,
            onClick: isPollModerationEnabled ? disablePollModeration : enablePollModeration,
            text: t('participantsPane.actions.pollModeration')
        }, {
            accessibilityLabel: t('participantsPane.actions.nameModeration'),
            className: isNameModerationEnabled ? classes.indentedLabel : '',
            id: isNameModerationEnabled
                ? 'participants-pane-context-menu-stop-name-moderation'
                : 'participants-pane-context-menu-start-name-moderation',
            icon: !isNameModerationEnabled && IconCheck,
            onClick: isNameModerationEnabled ? disableNameModeration : enableNameModeration,
            text: t('participantsPane.actions.nameModeration')
        }
    ];


    return (
        <ContextMenu
            className={classes.contextMenu}
            hidden = { !isOpen }
            isDrawerOpen = { isOpen }
            onDrawerClose = { onDrawerClose }
            onMouseLeave={onMouseLeave}>

            {actions.length > 0 && <ContextMenuItemGroup actions={actions} />}

            <ContextMenuItemGroup
                actions={[{
                    accessibilityLabel: t('participantsPane.actions.stopEveryonesVideo'),
                    id: 'participants-pane-context-menu-stop-video',
                    icon: IconVideoOff,
                    onClick: muteAllVideo,
                    text: t('participantsPane.actions.stopEveryonesVideo')
                }]} />

            {isModerationSupported && (participantCount === 1 || !allModerators) && (
                <ContextMenuItemGroup actions={moderationActions}>
                    <div className={classes.text}>
                        <span>{t('participantsPane.actions.allow')}</span>
                    </div>
                </ContextMenuItemGroup>
            )}

            <ContextMenuItemGroup
                actions = { [ {
                    accessibilityLabel: t('participantsPane.actions.moreModerationControls'),
                    id: 'participants-pane-open-moderation-control-settings',
                    icon: IconHorizontalPoints,
                    onClick: openModeratorSettings,
                    text: t('participantsPane.actions.moreModerationControls')
                } ] } />
        </ContextMenu>
    );
};
