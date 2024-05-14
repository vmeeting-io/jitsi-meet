// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { connect, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { translate } from '../../../base/i18n/functions';
import { isHost } from '../../../base/jwt/functions';
import Popover from '../../../base/popover/components/Popover.web';
import { getLocalVideoTrack } from '../../../base/tracks/functions';
import ContextMenu from '../../../base/ui/components/web/ContextMenu';
import { isScreenVideoShared } from '../../../screen-share/functions';
import WhiteboardButton from '../../../whiteboard/components/web/WhiteboardButton';
import {
    setOverflowMenuVisible,
    setShareMenuVisible,
    setToolbarHovered,
} from '../../actions';

import ShareDesktopButton from './ShareDesktopButton';
import ShareToggleButton from './ShareToggleButton';
import { isForceMuted } from '../../../participants-pane/functions';
import { getLocalParticipant } from '../../../base/participants/functions';
import { isDesktopShareButtonDisabled } from '../../functions.web';


const useStyles = makeStyles()((_theme) => {
    return {
        contextMenu: {
            position: 'relative',
            right: 'auto',
            margin: 0,
            marginBottom: '8px',
            maxHeight: 'calc(100dvh - 100px)',
            minWidth: '240px',
            overflow: 'hidden'
        },
        content: {
            position: 'relative',
            maxHeight: 'calc(100dvh - 100px)',
            overflowY: 'auto'
        },
    };
});
    
function ShareMenuButton({ isOpen }) {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const onCloseDialog = useCallback(() => {
        dispatch(setShareMenuVisible(false));
        dispatch(setToolbarHovered(false));
    }, [ dispatch ]);

    const onOpenDialog = useCallback(() => {
        dispatch(setOverflowMenuVisible(false));
        dispatch(setShareMenuVisible(true));
        dispatch(setToolbarHovered(true));
    }, [ dispatch ]);

    const onEscKey = useCallback((e) => {
        if (e.key === 'Escape' && isOpen) {
            e.preventDefault();
            e.stopPropagation();
            onCloseDialog();
        }
    }, [ onCloseDialog ]);

    const accessibilityLabel = 'toolbar.accessibilityLabel.shareMenu';

    const { classes } = useStyles();

    const shareMenus = (
        <ContextMenu
            accessibilityLabel = { t(accessibilityLabel) }
            className = { classes.contextMenu }
            hidden = { false }
            id = 'share-context-menu'>
            <div className = { classes.content }>
                <ShareDesktopButton key = 'desktop' contextMenu showLabel />
                <WhiteboardButton key = 'whiteboard' contextMenu showLabel />
            </div>
        </ContextMenu>
    );

    return (
        <div className = 'toolbox-button-wth-dialog context-menu'>
            <Popover
                content = { shareMenus }
                headingId = 'share-context-menu'
                onPopoverClose = { onCloseDialog }
                onPopoverOpen = { onOpenDialog }
                position = 'top'
                trigger = 'click'
                visible = { isOpen }>
                <ShareToggleButton
                    isMenuButton = { true }
                    isOpen = { isOpen }
                    onKeyDown = { onEscKey } />
            </Popover>
        </div>
    );
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    const { shareMenuVisible } = state['features/toolbox'];

    return {
        isOpen: shareMenuVisible,
    };
}

export default translate(connect(mapStateToProps)(ShareMenuButton));
