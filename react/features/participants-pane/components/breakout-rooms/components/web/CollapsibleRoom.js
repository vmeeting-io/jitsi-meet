import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../../../base/icons/components/Icon';
import { IconArrowDown, IconArrowUp } from '../../../../../base/icons/svg';
import { isLocalParticipantModerator } from '../../../../../base/participants/functions';
import { withPixelLineHeight } from '../../../../../base/styles/functions.web';
import ListItem from '../../../../../base/ui/components/web/ListItem';
import { showOverflowDrawer } from '../../../../../toolbox/functions.web';
import { ACTION_TRIGGER } from '../../../../constants';
import { participantMatchesSearch } from '../../../../functions';
import ParticipantActionEllipsis from '../../../web/ParticipantActionEllipsis';
import ParticipantItem from '../../../web/ParticipantItem';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            boxShadow: 'none'
        },

        roomName: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            ...withPixelLineHeight(theme.typography.bodyLongBold)
        },

        arrowContainer: {
            backgroundColor: theme.palette.ui03,
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            marginRight: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none'
        }
    };
});

export const CollapsibleRoom = ({
    actionsTrigger = ACTION_TRIGGER.HOVER,
    children,
    isHighlighted,
    onRaiseMenu,
    onLeave,
    participantContextEntity,
    raiseParticipantContextMenu,
    room,
    searchString,
    toggleParticipantMenu
}) => {
    const { t } = useTranslation();
    const { classes: styles, cx } = useStyles();
    const [ collapsed, setCollapsed ] = useState(false);
    const toggleCollapsed = useCallback(() => {
        setCollapsed(!collapsed);
    }, [ collapsed ]);
    const raiseMenu = useCallback(target => {
        onRaiseMenu(target);
    }, [ onRaiseMenu ]);
    const { defaultRemoteDisplayName } = useSelector((state) => state['features/base/config']);
    const overflowDrawer: boolean = useSelector(showOverflowDrawer);
    const moderator = useSelector(isLocalParticipantModerator);

    const arrow = (<button
        aria-label = { collapsed ? t('breakoutRooms.hideParticipantList', 'Hide participant list')
            : t('breakoutRooms.showParticipantList', 'Show participant list')
        }
        className = { styles.arrowContainer }>
        <Icon
            size = { 14 }
            src = { collapsed ? IconArrowDown : IconArrowUp } />
    </button>);

    const roomName = (<span className = { styles.roomName }>
        {`${room.name || t('breakoutRooms.mainRoom')} (${Object.keys(room?.participants
            || {}).length})`}
    </span>);

    const raiseParticipantMenu = useCallback(({ participantID, displayName }) => moderator
    && raiseParticipantContextMenu({
        room,
        jid: participantID,
        participantName: displayName
    }), [ room, moderator ]);

    return (<>
        <ListItem
            actions = { children }
            className = { cx(styles.container, 'breakout-room-container') }
            defaultName = { `${room.name || t('breakoutRooms.mainRoom')} (${Object.keys(room?.participants
                || {}).length})` }
            icon = { arrow }
            isHighlighted = { isHighlighted }
            onClick = { toggleCollapsed }
            onLongPress = { raiseMenu }
            onMouseLeave = { onLeave }
            testId = { room.id }
            textChildren = { roomName }
            trigger = { actionsTrigger } />
        {!collapsed && room?.participants
            && Object.values(room?.participants || {}).map(p =>
                participantMatchesSearch(p, searchString) && (
                    <ParticipantItem
                        actionsTrigger = { ACTION_TRIGGER.HOVER }
                        displayName = { p.displayName || defaultRemoteDisplayName }
                        isHighlighted = { participantContextEntity?.jid === p.jid }
                        key = { p.jid }
                        local = { false }
                        openDrawerForParticipant = { raiseParticipantMenu }
                        overflowDrawer = { overflowDrawer }
                        participantID = { p.jid }>
                        {!overflowDrawer && moderator && (
                            <ParticipantActionEllipsis
                                accessibilityLabel = { t('breakoutRoom.more') }
                                onClick = { toggleParticipantMenu({ room,
                                    jid: p.jid,
                                    participantName: p.displayName }) } />
                        )}
                    </ParticipantItem>
                ))
        }
    </>);
};
