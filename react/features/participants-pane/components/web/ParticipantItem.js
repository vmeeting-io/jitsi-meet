// @flow

import { makeStyles } from '@material-ui/styles';
import React, { type Node, useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { Avatar } from '../../../base/avatar';
import { ListItem } from '../../../base/components';
import { Icon, IconPinned } from '../../../base/icons';
import { translate } from '../../../base/i18n';
import { pinParticipant } from '../../../base/participants';
import {
    ACTION_TRIGGER,
    AudioStateIcons,
    MEDIA_STATE,
    type ActionTrigger,
    type MediaState,
    VideoStateIcons
} from '../../constants';
import { STATUS_TABLE } from '../../../face-detect/constants';

import { RaisedHandIndicator } from './RaisedHandIndicator';
import { BirthdayIndicator } from './BirthdayIndicator';

type Props = {

    /**
     * Type of trigger for the participant actions.
     */
    actionsTrigger?: ActionTrigger,

    /**
     * Media state for audio.
     */
    audioMediaState?: MediaState,

    /**
     * React children.
     */
    children?: Node,

    /**
     * Whether or not to disable the moderator indicator.
     */
    disableModeratorIndicator: boolean,

    /**
     * The name of the participant. Used for showing lobby names.
     */
    displayName: string,

    /**
     * Is this item highlighted/raised.
     */
    isHighlighted?: boolean,

    /**
     * Whether or not the participant is a moderator.
     */
    isModerator: boolean,

    /**
     * Whether or not today is meeting participant's birthday
     */
    isParticipantBirthday: Boolean,

    /**
     * True if the participant is local.
     */
    local: boolean,

    /**
     * Opens a drawer with participant actions.
     */
    openDrawerForParticipant?: Function,

    /**
     * Callback for when the mouse leaves this component.
     */
    onLeave?: Function,

    /**
     * If an overflow drawer can be opened.
     */
    overflowDrawer?: boolean,

    /**
     * The ID of the participant.
     */
    participantID: string,

    /**
     * True if the participant have raised hand.
     */
    raisedHand?: boolean,

    /**
     * Media state for video.
     */
    videoMediaState?: MediaState,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * The translated "you" text.
     */
    youText?: string
}

const useStyles = makeStyles(theme => {
    return {
        labelContainer: {
            display: 'flex',
            flexDirection: 'row',
            overflow: 'hidden'
        },

        detailsContainer: {
            display: 'flex',
            flex: 1,
            marginRight: 8,
            overflow: 'hidden',
            flexDirection: 'column',
            justifyContent: 'flex-start'
        },

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
            ...theme.typography.labelRegular,
            lineHeight: `${theme.typography.labelRegular.lineHeight}px`,
            color: theme.palette.text03
        }
    };
});

/**
 * A component representing a participant entry in ParticipantPane and Lobby.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactNode}
 */
function ParticipantItem({
    aiAttentionFlag,
    actionsTrigger = ACTION_TRIGGER.HOVER,
    audioMediaState = MEDIA_STATE.NONE,
    children,
    disableModeratorIndicator,
    displayName,
    followMeModerator,
    isHighlighted,
    isModerator,
    isParticipantBirthday,
    isPinned,
    isVideoMuted,
    local,
    onLeave,
    openDrawerForParticipant,
    overflowDrawer,
    participantID,
    participantStatus,
    raisedHand,
    t,
    videoMediaState = MEDIA_STATE.NONE,
    youText
}: Props) {
    const dispatch = useDispatch();
    const onClick = useCallback(() => {
        dispatch(pinParticipant(isPinned ? null : participantID));
    }, [isPinned, participantID]);

    const styles = useStyles();

    // Dummy array that randomly assigns concentrated, lapsed or absent, must be replaced with the data from the model
    let attentionClass = 'participant-avatar-container ';
    if (aiAttentionFlag && participantStatus) {
        attentionClass += isVideoMuted ? STATUS_TABLE[2] : participantStatus;
    }

    const icon = (
        <div className={attentionClass} >
            <Avatar
                className = 'participant-avatar'
                displayName = { displayName }
                participantId = { participantID }
                size = { 32 } />
            { isPinned && (
                <Icon
                    className = 'pin-icon'
                    size = { 12 }
                    src = { IconPinned } />
            )}
        </div>
    );

    const text = (
        <div className = { styles.detailsContainer }>
            <div className = { styles.nameContainer }>
                <div className = { styles.name }>
                    {displayName}
                </div>
                {local ? <span>&nbsp;({youText})</span> : null}
            </div>
            <div className = { styles.labelContainer }>
                {isModerator && !disableModeratorIndicator && <div className = { styles.moderatorLabel }>
                    {t('videothumbnail.moderator')}
                </div>}
                { followMeModerator === participantID && <div className = { styles.moderatorLabel }>
                    , {t('videothumbnail.following')}
                </div>}
            </div>
        </div>
    );

    const indicators = (
        <>
            {isParticipantBirthday && <BirthdayIndicator />}
            {raisedHand && <RaisedHandIndicator />}
            {VideoStateIcons[videoMediaState]}
            {AudioStateIcons[audioMediaState]}
        </>
    );

    return (
        <ListItem
            actions = { children }
            icon = { icon }
            id = { `participant-item-${participantID}` }
            indicators = { indicators }
            isHighlighted = { isHighlighted }
            $local = { local }
            onClick = { onClick }
            onMouseLeave = { onLeave }
            textChildren = { text }
            trigger = { actionsTrigger } />
    );
}

export default translate(ParticipantItem);
