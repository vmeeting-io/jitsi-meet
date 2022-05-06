// @flow

import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import {
    requestDisableAudioModeration,
    requestDisableVideoModeration,
    requestEnableAudioModeration,
    requestEnableVideoModeration
} from '../../av-moderation/actions';
import {
    isEnabled as isAvModerationEnabled,
    isSupported as isAvModerationSupported
} from '../../av-moderation/functions';
import { openDialog } from '../../base/dialog';
import { Icon, IconCheck, IconVideoOff, IconAnnouncement, IconStopWatch } from '../../base/icons';
import { MEDIA_TYPE } from '../../base/media';
import {
    getLocalParticipant,
    getParticipantCount,
    getParticipantDisplayName,
    isEveryoneModerator
} from '../../base/participants';
import { MuteEveryonesVideoDialog } from '../../video-menu/components';
import {TimerDialog,TimerCancelDialog} from './web'

import {
    ContextMenu,
    ContextMenuItem,
    ContextMenuItemGroup
} from './web/styled';

import {
    notifyRandomSelectionStarted,
    randomlySelectFromAllParticipants,
    notifyRandomSelectionCompleted,
} from '../actions.any';
import { initAnalytics } from '../../analytics';

const useStyles = makeStyles(() => {
    return {
        contextMenu: {
            bottom: 'auto',
            margin: '0',
            padding: '8px 0',
            right: 0,
            top: '-8px',
            transform: 'translateY(-100%)',
            width: '283px'
        },
        drawer: {
            width: '100%',
            top: 'auto',
            bottom: 0,
            transform: 'none',
            position: 'relative',

            '& > div': {
                lineHeight: '32px'
            }
        },
        menudisabled: {
            pointerEvents: 'none',
            cursor: 'not-allowed',
            opacity: 0.65,
            filter: 'alpha(opacity=65)',
            WebkitBoxShadow: 'none',
            BoxShadow: 'none',
        },

        text: {
            color: '#C2C2C2',
            padding: '10px 16px'
        },
        paddedAction: {
            marginLeft: '36px'
        }
    };
});

type Props = {

    /**
     * Whether the menu is displayed inside a drawer.
     */
    inDrawer?: boolean,

    /**
     * Callback for the mouse leaving this item.
     */
    onMouseLeave?: Function
};

export const FooterContextMenu = ({ inDrawer, onMouseLeave }: Props) => {
    const dispatch = useDispatch();
    const isModerationSupported = useSelector(isAvModerationSupported());
    const allModerators = useSelector(isEveryoneModerator);
    const isAudioModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.AUDIO));
    const isVideoModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.VIDEO));
    const isModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.AUDIO));
    const { id } = useSelector(getLocalParticipant);

    // gets the display name of the participant who clicked on the FooterContextMenu
    const initiator = getParticipantDisplayName(APP.store.getState(), id);

    const { t } = useTranslation();

    const disableAudioModeration = useCallback(() => dispatch(requestDisableAudioModeration()), [ dispatch ]);

    const disableVideoModeration = useCallback(() => dispatch(requestDisableVideoModeration()), [ dispatch ]);

    const enableAudioModeration = useCallback(() => dispatch(requestEnableAudioModeration()), [ dispatch ]);

    const enableVideoModeration = useCallback(() => dispatch(requestEnableVideoModeration()), [ dispatch ]);

    const classes = useStyles();
    let isRandomSelectionRunning = (APP.store.getState()['features/base/conference'].startCountdown === true) ? true : false;
    const randomselectionClass = isRandomSelectionRunning ? classes.menudisabled : '';

    const participantCount = getParticipantCount(APP.store.getState());

    const muteAllVideo = useCallback(
        () => dispatch(openDialog(MuteEveryonesVideoDialog)), [ dispatch ]);

    const startRandomSelection = useCallback(
        () => {
            // function that notifies random selection procedure has now started
            notifyRandomSelectionStarted(initiator);

            // toggling of menu option is also being handled by 'onMouseLeave' which toggles the display menu
            // thus, we use the existing function to imitate action to hide the menu option after the option was clicked
            onMouseLeave();

            // set a timeout of 5 seconds before executing rest of the code
            setTimeout(function() {
                // randomly selects a participant from allParticipants and get its display name
                const randomParticipantID = randomlySelectFromAllParticipants();
                const selectedParticipantDisplayName = getParticipantDisplayName(APP.store.getState(), randomParticipantID);

                // notify the selection of participant and propagate randomParticipantID which will be used during pinning the participant
                notifyRandomSelectionCompleted(selectedParticipantDisplayName, randomParticipantID);
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

    return (
        <ContextMenu
            className = { clsx(classes.contextMenu, inDrawer && clsx(classes.drawer)) }
            onMouseLeave = { onMouseLeave }>

            {/* context menu item for random selection */}
            { 
                participantCount >= 3 
                ? <ContextMenuItem
                        className = { randomselectionClass }
                        id = 'participants-pane-context-menu-random-selection'
                        onClick = { startRandomSelection }>
                        <Icon
                            size = { 18 }
                            src = { IconAnnouncement } />
                        <span>{ t('participantsPane.actions.startRandomSelection') }</span>
                </ContextMenuItem>
                : <></>
            }

            {/* context menu item for timer function */}
            { participantCount > 1 ? 
            <>
            {!APP.store.getState()["features/base/conference"].timerStarted &&  <ContextMenuItem
                id = 'participants-pane-context-menu-timer'
                onClick = { _onStartTimerClick }>
                <Icon
                    size = { 18 }
                    src = { IconStopWatch } />
                <span>{ t('participantsPane.actions.startTimerLabel') }</span>
            </ContextMenuItem>}
            
            {APP.store.getState()["features/base/conference"].timerStarted && <ContextMenuItem
                id = 'participants-pane-context-menu-timer'
                onClick = { _onEndTimerClick }>
                <Icon
                    size = { 18 }
                    src = { IconStopWatch } />
                <span>{ t('participantsPane.actions.stopTimer') }</span>
            </ContextMenuItem>}
            </>:<></>
            } 

            <ContextMenuItem
                id = 'participants-pane-context-menu-stop-video'
                onClick = { muteAllVideo }>
                <Icon
                    size = { 20 }
                    src = { IconVideoOff } />
                <span>{ t('participantsPane.actions.stopEveryonesVideo') }</span>
            </ContextMenuItem>

            { isModerationSupported && (participantCount === 1 || !allModerators) ? (
                <>
                    <div className = { classes.text }>
                        {t('participantsPane.actions.allow')}
                    </div>
                    { isAudioModerationEnabled ? (
                        <ContextMenuItem
                            id = 'participants-pane-context-menu-stop-audio-moderation'
                            onClick = { disableAudioModeration }>
                            <span className = { classes.paddedAction }>
                                {t('participantsPane.actions.audioModeration') }
                            </span>
                        </ContextMenuItem>
                    ) : (
                        <ContextMenuItem
                            id = 'participants-pane-context-menu-start-audio-moderation'
                            onClick = { enableAudioModeration }>
                            <Icon
                                size = { 20 }
                                src = { IconCheck } />
                            <span>{t('participantsPane.actions.audioModeration') }</span>
                        </ContextMenuItem>
                    )}
                    { isVideoModerationEnabled ? (
                        <ContextMenuItem
                            id = 'participants-pane-context-menu-stop-video-moderation'
                            onClick = { disableVideoModeration }>
                            <span className = { classes.paddedAction }>
                                {t('participantsPane.actions.videoModeration')}
                            </span>
                        </ContextMenuItem>
                    ) : (
                        <ContextMenuItem
                            id = 'participants-pane-context-menu-start-video-moderation'
                            onClick = { enableVideoModeration }>
                            <Icon
                                size = { 20 }
                                src = { IconCheck } />
                            <span>{t('participantsPane.actions.videoModeration')}</span>
                        </ContextMenuItem>
                    )}
                </>
            ) : undefined
            }
        </ContextMenu>
    );
};
