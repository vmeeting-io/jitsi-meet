import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import {
    requestDisableModeration,
    requestEnableModeration
} from '../../../av-moderation/actions';
import {
    isEnabled as isAvModerationEnabled,
    isSupported as isAvModerationSupported
} from '../../../av-moderation/functions';
import { isStartCountDown } from '../../../base/conference/functions';
import { openDialog } from '../../../base/dialog/actions';
import {
    IconAnnouncement,
    IconCheck,
    IconDotsHorizontal,
    IconRaisedHandClear,
    IconStopWatch,
    IconVideoOff
} from '../../../base/icons/svg';
import { MEDIA_TYPE } from '../../../base/media/constants';
import {
    getLocalParticipant,
    getParticipantCount,
    getParticipantDisplayName,
    isEveryoneModerator
} from '../../../base/participants/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import ContextMenu from '../../../base/ui/components/web/ContextMenu';
import ContextMenuItemGroup from '../../../base/ui/components/web/ContextMenuItemGroup';
import { isBreakoutRoomsAllowed, isInBreakoutRoom } from '../../../breakout-rooms/functions';
import { openSettingsDialog } from '../../../settings/actions.web';
import { SETTINGS_TABS } from '../../../settings/constants';
import { shouldShowModeratorSettings } from '../../../settings/functions.web';
import { getTimerStarted } from '../../../timer/functions';
import MuteEveryonesVideoDialog from '../../../video-menu/components/web/MuteEveryonesVideoDialog';
import { isWhiteboardAllowed } from '../../../whiteboard/functions';

import {
    notifyRandomSelectionStarted,
    notifyRandomSelectionCompleted,
    clearRaisedHands,
} from '../../actions.any';
import { randomlySelectFromAllParticipants } from '../../selectors';

import TimerDialog from './TimerDialog';
import TimerCancelDialog from './TimerCancelDialog';

const useStyles = makeStyles()(theme => {
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
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            color: theme.palette.text02,
            padding: '10px 16px',
            height: '40px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box'
        },

        indentedLabel: {
            span: {
                marginLeft: '36px'
            }
        }
    };
});

export const FooterContextMenu = ({ isOpen, onDrawerClose, onMouseLeave }) => {
    const dispatch = useDispatch();
    const isModerationSupported = useSelector((state) => isAvModerationSupported()(state));
    const allModerators = useSelector(isEveryoneModerator);
    const isModeratorSettingsTabEnabled = useSelector(shouldShowModeratorSettings);
    const participantCount = useSelector(getParticipantCount);
    const isAudioModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.AUDIO));
    const isVideoModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.VIDEO));
    const isChatModerationEnabled = useSelector(isAvModerationEnabled('chat'));
    const isPollModerationEnabled = useSelector(isAvModerationEnabled('poll'));
    const isNameModerationEnabled = useSelector(isAvModerationEnabled('name'));
    const isScreenShareModerationEnabled = useSelector(isAvModerationEnabled('presenter'));
    const isBreakoutModerationEnabled = useSelector(isAvModerationEnabled('breakout'));
    const isWhiteboardModerationEnabled = useSelector(isAvModerationEnabled('whiteboard'));
    const isBreakoutRoom = useSelector(isInBreakoutRoom);
    const isBreakoutRoomsEnabled = useSelector(isBreakoutRoomsAllowed);
    const isWhiteboardEnabled = useSelector(isWhiteboardAllowed);

    const { id } = useSelector(getLocalParticipant);
    const timerStarted = useSelector(getTimerStarted);
    const initiator = useSelector(state => getParticipantDisplayName(state, id));
    const isRandomSelectionRunning = useSelector(isStartCountDown);
    const randomselectionClass = isRandomSelectionRunning ? classes.menudisabled : '';
    const randomParticipantID = useSelector(randomlySelectFromAllParticipants);
    const raisedHandsCount = useSelector(state =>
        (state['features/base/participants'].raisedHandsQueue || []).length);

    // randomly selects a participant from allParticipants and get its display name
    const selectedParticipantDisplayName = useSelector(state => getParticipantDisplayName(state, randomParticipantID));

    const { t } = useTranslation();

    const disableAudioModeration = useCallback(() => dispatch(requestDisableModeration(MEDIA_TYPE.AUDIO)), [ dispatch ]);
    const disableVideoModeration = useCallback(() => dispatch(requestDisableModeration(MEDIA_TYPE.VIDEO)), [ dispatch ]);
    const disableChatModeration = useCallback(() => dispatch(requestDisableModeration('chat')), [dispatch]);
    const disablePollModeration = useCallback(() => dispatch(requestDisableModeration('poll')), [dispatch]);
    const disableNameModeration = useCallback(() => dispatch(requestDisableModeration('name')), [dispatch]);
    const disableScreenShareModeration = useCallback(() => dispatch(requestDisableModeration('presenter')), [dispatch]);
    const disableBreakoutModeration = useCallback(() => dispatch(requestDisableModeration('breakout')), [dispatch]);
    const disableWhiteboardModeration = useCallback(() => dispatch(requestDisableModeration('whiteboard')), [dispatch]);

    const enableAudioModeration = useCallback(() => dispatch(requestEnableModeration(MEDIA_TYPE.AUDIO)), [ dispatch ]);
    const enableVideoModeration = useCallback(() => dispatch(requestEnableModeration(MEDIA_TYPE.VIDEO)), [ dispatch ]);
    const enableChatModeration = useCallback(() => dispatch(requestEnableModeration('chat')), [dispatch]);
    const enablePollModeration = useCallback(() => dispatch(requestEnableModeration('poll')), [dispatch]);
    const enableNameModeration = useCallback(() => dispatch(requestEnableModeration('name')), [dispatch]);
    const enableScreenShareModeration = useCallback(() => dispatch(requestEnableModeration('presenter')), [dispatch]);
    const enableBreakoutModeration = useCallback(() => dispatch(requestEnableModeration('breakout')), [dispatch]);
    const enableWhiteboardModeration = useCallback(() => dispatch(requestEnableModeration('whiteboard')), [dispatch]);

    const { classes } = useStyles();

    const muteAllVideo = useCallback(
        () => dispatch(openDialog(MuteEveryonesVideoDialog)), [ dispatch ]);

    const resetRaisedHands = useCallback(
        () => dispatch(clearRaisedHands()), [dispatch]);

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

    // if (participantCount >= 3) {
    //     // for random selection
    //     actions.push({
    //         accessibilityLabel: t('participantsPane.actions.startRandomSelection'),
    //         className: randomselectionClass,
    //         id: 'participants-pane-context-menu-random-selection',
    //         icon: IconAnnouncement,
    //         iconSize: 18,
    //         onClick: startRandomSelection,
    //         text: t('participantsPane.actions.startRandomSelection')
    //     });
    // }
    // if (participantCount > 1) {
    //     const label = t(timerStarted ? 'participantsPane.actions.stopTimer' : 'participantsPane.actions.startTimerLabel');
    //     actions.push({
    //         accessibilityLabel: label,
    //         id: 'participants-pane-context-menu-timer',
    //         icon: IconStopWatch,
    //         iconSize: 18,
    //         onClick: timerStarted ? _onEndTimerClick : _onStartTimerClick,
    //         text: label
    //     });
    // }
    if (raisedHandsCount > 0) {
        actions.push({
            accessibilityLabel: t('participantsPane.actions.clearRaisedHands'),
            id: 'participants-pane-context-menu-clear-raised-hands',
            icon: IconRaisedHandClear,
            onClick: resetRaisedHands,
            text: t('participantsPane.actions.clearRaisedHands')
        })
    }

    const moderationActions = [{
        accessibilityLabel: t('participantsPane.actions.screenShareModeration'),
        className: isScreenShareModerationEnabled ? classes.indentedLabel : '',
        id: isScreenShareModerationEnabled
            ? 'participants-pane-context-menu-stop-screen-share-moderation'
            : 'participants-pane-context-menu-start-screen-share-moderation',
        icon: !isScreenShareModerationEnabled && IconCheck,
        onClick: isScreenShareModerationEnabled ? disableScreenShareModeration : enableScreenShareModeration,
        text: t('participantsPane.actions.screenShareModeration')
    }, {
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
    }];


    if (isBreakoutRoomsEnabled) {
        moderationActions.push({
            accessibilityLabel: t('participantsPane.actions.breakoutModeration'),
            className: isBreakoutModerationEnabled ? classes.indentedLabel : '',
            id: isBreakoutModerationEnabled
                ? 'participants-pane-context-menu-stop-breakout-moderation'
                : 'participants-pane-context-menu-start-breakout-moderation',
            icon: !isBreakoutModerationEnabled && IconCheck,
            onClick: isBreakoutModerationEnabled ? disableBreakoutModeration : enableBreakoutModeration,
            text: t('participantsPane.actions.breakoutModeration')
        });
    }
    
    if (isWhiteboardEnabled) {
        moderationActions.push({
            accessibilityLabel: t('participantsPane.actions.whiteboardModeration'),
            className: isWhiteboardModerationEnabled ? classes.indentedLabel : '',
            id: isWhiteboardModerationEnabled
                ? 'participants-pane-context-menu-stop-whiteboard-moderation'
                : 'participants-pane-context-menu-start-whiteboard-moderation',
            icon: !isWhiteboardModerationEnabled && IconCheck,
            onClick: isWhiteboardModerationEnabled ? disableWhiteboardModeration : enableWhiteboardModeration,
            text: t('participantsPane.actions.whiteboardModeration')
        })
    }

    return (
        <ContextMenu
            activateFocusTrap = { true }
            className = { classes.contextMenu }
            hidden = { !isOpen }
            isDrawerOpen = { isOpen }
            onDrawerClose = { onDrawerClose }
            onMouseLeave = { onMouseLeave }>

            {actions.length > 0 && <ContextMenuItemGroup actions={actions} />}

            <ContextMenuItemGroup
                actions = { [ {
                    accessibilityLabel: t('participantsPane.actions.stopEveryonesVideo'),
                    id: 'participants-pane-context-menu-stop-video',
                    icon: IconVideoOff,
                    onClick: muteAllVideo,
                    text: t('participantsPane.actions.stopEveryonesVideo')
                } ] } />
            
            {!isBreakoutRoom && isModerationSupported && (participantCount === 1 || !allModerators) && (
                <ContextMenuItemGroup actions = { moderationActions }>
                    <div className = { classes.text }>
                        <span>{t('participantsPane.actions.allow')}</span>
                    </div>
                </ContextMenuItemGroup>
            )}
            {isModeratorSettingsTabEnabled && (
                <ContextMenuItemGroup
                    actions = { [ {
                        accessibilityLabel: t('participantsPane.actions.moreModerationControls'),
                        id: 'participants-pane-open-moderation-control-settings',
                        icon: IconDotsHorizontal,
                        onClick: openModeratorSettings,
                        text: t('participantsPane.actions.moreModerationControls')
                    } ] } />
            )}
        </ContextMenu>
    );
};
