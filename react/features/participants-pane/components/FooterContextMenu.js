// @flow

import { makeStyles } from '@material-ui/core/styles';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { requestDisableModeration, requestEnableModeration } from '../../av-moderation/actions';
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
    ContextMenuItem
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
            width: '238px'
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
            marginLeft: '52px',
            lineHeight: '40px'
        },
        paddedAction: {
            marginLeft: '36px;'
        }
    };
});

type Props = {

  /**
   * Callback for the mouse leaving this item
   */
  onMouseLeave: Function
};

export const FooterContextMenu = ({ onMouseLeave }: Props) => {
    const dispatch = useDispatch();
    const isModerationSupported = useSelector(isAvModerationSupported());
    const allModerators = useSelector(isEveryoneModerator);
    const isModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.AUDIO));
    const { id } = useSelector(getLocalParticipant);

    // gets the display name of the participant who clicked on the FooterContextMenu
    const initiator = getParticipantDisplayName(APP.store.getState(), id);

    const { t } = useTranslation();

    const disable = useCallback(() => dispatch(requestDisableModeration()), [ dispatch ]);

    const enable = useCallback(() => dispatch(requestEnableModeration()), [ dispatch ]);

    const classes = useStyles();
    let isRandomSelectionRunning = (APP.store.getState()['features/base/conference'].startCountdown === true) ? true : false;
    const randomselectionClass = isRandomSelectionRunning ? classes.menudisabled : '';

    const participantCount = getParticipantCount(APP.store.getState());

    const muteAllVideo = useCallback(
        () => dispatch(openDialog(MuteEveryonesVideoDialog, { exclude: [ id ] })), [ dispatch ]);

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
            className = { classes.contextMenu }
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


            <ContextMenuItem
                id = 'participants-pane-context-menu-stop-video'
                onClick = { muteAllVideo }>
                <Icon
                    size = { 20 }
                    src = { IconVideoOff } />
                <span>{ t('participantsPane.actions.stopEveryonesVideo') }</span>
            </ContextMenuItem>

            { isModerationSupported && !allModerators ? (
                <>
                    <div className = { classes.text }>
                        {t('participantsPane.actions.allow')}
                    </div>
                    { isModerationEnabled ? (
                        <ContextMenuItem
                            id = 'participants-pane-context-menu-start-moderation'
                            onClick = { disable }>
                            <span className = { classes.paddedAction }>
                                { t('participantsPane.actions.startModeration') }
                            </span>
                        </ContextMenuItem>
                    ) : (
                        <ContextMenuItem
                            id = 'participants-pane-context-menu-stop-moderation'
                            onClick = { enable }>
                            <Icon
                                size = { 20 }
                                src = { IconCheck } />
                            <span>{ t('participantsPane.actions.startModeration') }</span>
                        </ContextMenuItem>
                    )}
                </>
            ) : undefined
            }
        </ContextMenu>
    );
};
