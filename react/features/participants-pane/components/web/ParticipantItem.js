import React, { ReactNode, useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';

import Avatar from '../../../base/avatar/components/Avatar';
import { translate } from '../../../base/i18n/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import ListItem from '../../../base/ui/components/web/ListItem';
import {
    ACTION_TRIGGER,
    AudioStateIcons,
    MEDIA_STATE,
    VideoStateIcons
} from '../../constants';

import { RaisedHandIndicator } from './RaisedHandIndicator';

const useStyles = makeStyles()(theme => {
    return {
        nameContainer: {
            display: 'flex',
            flex: 1,
            overflow: 'hidden'
        },

        name: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },

        moderatorLabel: {
            ...withPixelLineHeight(theme.typography.labelBold),
            color: theme.palette.text03
        },

        avatar: {
            marginRight: theme.spacing(3)
        }
    };
});

/**
 * A component representing a participant entry in ParticipantPane and Lobby.
 *
 * @param {IProps} props - The props of the component.
 * @returns {ReactNode}
 */
function ParticipantItem({
    actionsTrigger = ACTION_TRIGGER.HOVER,
    audioMediaState = MEDIA_STATE.NONE,
    children,
    disableModeratorIndicator,
    displayName,
    isHighlighted,
    isModerator,
    local,
    onLeave,
    openDrawerForParticipant,
    overflowDrawer,
    participantID,
    raisedHand,
    t,
    videoMediaState = MEDIA_STATE.NONE,
    youText
}) {
    const onClick = useCallback(
        () => openDrawerForParticipant?.({
            participantID,
            displayName
        }), []);

    const { classes } = useStyles();

    const icon = (
        <Avatar
            className = { classes.avatar }
            displayName = { displayName }
            participantId = { participantID }
            size = { 32 } />
    );

    const text = (
        <>
            <div className = { classes.nameContainer }>
                <div className = { classes.name }>
                    {displayName}
                </div>
                {local ? <span>&nbsp;({youText})</span> : null}
            </div>
            {isModerator && !disableModeratorIndicator && <div className = { classes.moderatorLabel }>
                {t('videothumbnail.moderator')}
            </div>}
        </>
    );

    const indicators = (
        <>
            {raisedHand && <RaisedHandIndicator />}
            {VideoStateIcons[videoMediaState]}
            {AudioStateIcons[audioMediaState]}
        </>
    );

    return (
        <ListItem
            actions = { children }
            hideActions = { local }
            icon = { icon }
            id = { `participant-item-${participantID}` }
            indicators = { indicators }
            isHighlighted = { isHighlighted }
            onClick = { !local && overflowDrawer ? onClick : undefined }
            onMouseLeave = { onLeave }
            textChildren = { text }
            trigger = { actionsTrigger } />
    );
}

export default translate(ParticipantItem);
