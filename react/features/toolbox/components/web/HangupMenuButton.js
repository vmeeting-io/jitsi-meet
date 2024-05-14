import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import Avatar from '../../../base/avatar/components/Avatar';
import { leaveConference } from '../../../base/conference/actions';
import { grantModerator } from '../../../base/participants/actions';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import { selectParticipantDisplayName } from '../../../base/participants/selectors';
import Popover from '../../../base/popover/components/Popover.web';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import ContextMenu from '../../../base/ui/components/web/ContextMenu';
import ContextMenuItemGroup from '../../../base/ui/components/web/ContextMenuItemGroup';
import { getParticipantCountInBreakoutRooms, isInBreakoutRoom } from '../../../breakout-rooms/functions';

import { EndConferenceButton } from './EndConferenceButton';
import HangupToggleButton from './HangupToggleButton';
import { LeaveConferenceButton } from './LeaveConferenceButton';

const useStyles = makeStyles()(theme => {
    return {
        contextMenu: {
            position: 'relative',
            right: 'auto',
            margin: 0,
            marginBottom: '8px',
            maxHeight: 'calc(100dvh - 100px)',
            minWidth: '240px'
        },

        hangupMenu: {
            position: 'relative',
            right: 'auto',
            display: 'flex',
            flexDirection: 'column',
            rowGap: '8px',
            margin: 0,
            padding: '16px',
            marginBottom: '4px'
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
    };
});

/**
 * A React {@code Component} for opening or closing the {@code HangupMenu}.
 *
 * @augments Component
 */
function HangupMenuButton({
    isOpen,
    onVisibilityChange
}) {
    const [selectModeratorVisible, setSelectModeratorVisible] = useState(false);
    const { classes } = useStyles();
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const participantCount = useSelector(getParticipantCountInBreakoutRooms);
    const participants = useSelector(state => state['features/filmstrip'].remoteParticipants);
    const isHangupMenuVisible = useSelector(state => isInBreakoutRoom(state) ||
        (isLocalParticipantModerator(state) && participantCount > 1));
    const overflowDrawer = useSelector(state => state['features/toolbox'].overflowDrawer);
    const buttonsWithNotifyClick = useSelector(state => state['features/toolbox'].buttonsWithNotifyClick);
    const getParticipantName = useSelector(selectParticipantDisplayName);

    const onCloseDialog = useCallback(() => {
        onVisibilityChange(false);
        setSelectModeratorVisible(false);
    }, [onVisibilityChange]);

    const toggleDialogVisibility = useCallback(() => {
        sendAnalytics(createToolbarEvent('hangup'));

        if ( isHangupMenuVisible ) {
            onVisibilityChange(!isOpen);
            setSelectModeratorVisible(false);
        } else {
            dispatch(leaveConference());
        }
    }, [dispatch, isHangupMenuVisible, onVisibilityChange]);

    const onEscClick = useCallback((event) => {
        if (event.key === 'Escape' && isOpen) {
            event.preventDefault();
            event.stopPropagation();
            onCloseDialog();
        }
    }, [onCloseDialog]);

    const onSubmitSelectModerator = useCallback((id) => {
        dispatch(grantModerator(id));
        dispatch(leaveConference());
    }, [dispatch]);

    let children;

    if (isOpen) {
        if (selectModeratorVisible) {
            const actions = participants.map(id => {
                const name = getParticipantName(id);
                return {
                    accessibilityLabel: name,
                    id,
                    customIcon: <Avatar participantId = { id } size = { 24 } />,
                    onClick: () => onSubmitSelectModerator(id),
                    text: name
                }
            });
        
            children = (
                <ContextMenu
                    accessibilityLabel = { t('toolbar.accessibilityLabel.moreActionsMenu') }
                    className = { classes.contextMenu }
                    hidden = { false }
                    inDrawer = { overflowDrawer }
                    onKeyDown = { onEscClick }>
                    <ContextMenuItemGroup actions = { actions }>
                        <div className = { classes.text }>
                            <span>{t('toolbar.selectModeratorAndLeave')}</span>
                        </div>
                    </ContextMenuItemGroup>
                </ContextMenu>
            )
        } else {
            children = (
                <ContextMenu
                    accessibilityLabel = { t('toolbar.accessibilityLabel.moreActionsMenu') }
                    className = { classes.hangupMenu }
                    hidden = { false }
                    inDrawer = { overflowDrawer }
                    onKeyDown = { onEscClick }>
                    <EndConferenceButton
                        buttonKey = 'end-meeting'
                        notifyMode = { buttonsWithNotifyClick?.get('end-meeting') } />
                    <LeaveConferenceButton
                        buttonKey = 'hangup'
                        notifyMode = { buttonsWithNotifyClick?.get('hangup') }
                        showSelectModerator = { () => setSelectModeratorVisible(true) } />
                </ContextMenu>
            );
        }
    }

    return (
        <div className = 'toolbox-button-wth-dialog context-menu'>
            <Popover
                content = { children }
                headingLabel = { t('toolbar.accessibilityLabel.hangup') }
                onPopoverClose = { onCloseDialog }
                position = 'top'
                trigger = 'click'
                visible = { isOpen }>
                <HangupToggleButton
                    buttonKey = 'hangup-menu'
                    customClass = 'hangup-menu-button'
                    handleClick = { toggleDialogVisibility }
                    isOpen = { isOpen }
                    notifyMode = { buttonsWithNotifyClick?.get('hangup-menu') }
                    onKeyDown = { onEscClick } />
            </Popover>
        </div>
    );
}

export default HangupMenuButton;
