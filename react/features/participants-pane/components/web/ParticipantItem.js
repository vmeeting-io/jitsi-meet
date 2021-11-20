// @flow

import React, { type Node, useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { Avatar } from '../../../base/avatar';
import { Icon, IconPinned } from '../../../base/icons';
import { translate } from '../../../base/i18n';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import {
    ACTION_TRIGGER,
    AudioStateIcons,
    MEDIA_STATE,
    type ActionTrigger,
    type MediaState,
    VideoStateIcons
} from '../../constants';

import { RaisedHandIndicator } from './RaisedHandIndicator';
import { BirthdayIndicator } from './BirthdayIndicator';
import {
    LabelContainer,
    ModeratorLabel,
    ParticipantActionsHover,
    ParticipantActionsPermanent,
    ParticipantContainer,
    ParticipantContent,
    ParticipantDetailsContainer,
    ParticipantName,
    ParticipantNameContainer,
    ParticipantStates
} from './styled';
import { pinParticipant } from '../../../base/participants';
import { STATUS_TABLE } from '../../../face-detect/constants';


/**
 * Participant actions component mapping depending on trigger type.
 */
const Actions = {
    [ACTION_TRIGGER.HOVER]: ParticipantActionsHover,
    [ACTION_TRIGGER.PERMANENT]: ParticipantActionsPermanent
};

type Props = {

    /**
     * Type of trigger for the participant actions
     */
    actionsTrigger?: ActionTrigger,

    /**
     * Media state for audio
     */
    audioMediaState?: MediaState,

    /**
     * Whether or not today is meeting participant's birthday
     */
    isParticipantBirthday: Boolean,

    /**
     * React children
     */
    children?: Node,

    /**
     * The name of the participant. Used for showing lobby names.
     */
    displayName: string,

    /**
     * Is this item highlighted/raised
     */
    isHighlighted?: boolean,

    /**
     * Whether or not the participant is a moderator.
     */
    isModerator: boolean,

    /**
     * True if the participant is local.
     */
    local: Boolean,

    /**
     * Opens a drawer with participant actions.
     */
    openDrawerForParticipant: Function,

    /**
     * Callback for when the mouse leaves this component
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
     * Media state for video
     */
    videoMediaState: MediaState,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * The translated "you" text.
     */
    youText?: string
}

/**
 * A component representing a participant entry in ParticipantPane and Lobby.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactNode}
 */
function ParticipantItem({
    aiAttentionFlag,
    isVideoMuted,
    isParticipantBirthday,
    isPinned,
    children,
    followMeModerator,
    isHighlighted,
    isModerator,
    onLeave,
    actionsTrigger = ACTION_TRIGGER.HOVER,
    audioMediaState = MEDIA_STATE.NONE,
    videoMediaState = MEDIA_STATE.NONE,
    displayName,
    participantID,
    participantStatus,
    local,
    openDrawerForParticipant,
    overflowDrawer,
    raisedHand,
    t,
    youText
}: Props) {
    const dispatch = useDispatch();
    const ParticipantActions = Actions[actionsTrigger];
    const onClick = useCallback(() => {
        dispatch(pinParticipant(isPinned ? null : participantID));
    }, [isPinned, participantID]);
    
    // Dummy array that randomly assigns concentrated, lapsed or absent, must be replaced with the data from the model
    let attentionClass = 'participant-avatar-container ';

    if (aiAttentionFlag && participantStatus) {
        attentionClass += isVideoMuted ? STATUS_TABLE[2] : participantStatus;
    }

    return (
        <ParticipantContainer
            id = { `participant-item-${participantID}` }
            isHighlighted = { isHighlighted }
            $local = { local }
            onClick = { onClick }
            onMouseLeave = { onLeave }
            trigger = { actionsTrigger }>
            
            {/* Participant avatar wrapper class, that is used to color the state of the participant's listening status */}
            <div className={attentionClass} >
                <Avatar
                    className = 'participant-avatar'
                    participantId = { participantID }
                    size = { 32 } />
                { isPinned && (
                    <Icon
                        className = 'pin-icon'
                        size = { 12 }
                        src = { IconPinned } />
                )}
            </div>
            <ParticipantContent>
                <ParticipantDetailsContainer>
                    <ParticipantNameContainer>
                        <ParticipantName>
                            { displayName }
                        </ParticipantName>
                        { local ? <span>&nbsp;({ youText })</span> : null }
                    </ParticipantNameContainer>
                    { isModerator && <LabelContainer>
                        <ModeratorLabel>
                            {t('videothumbnail.moderator')}
                        </ModeratorLabel>
                        { followMeModerator === participantID && <ModeratorLabel>
                            , {t('videothumbnail.following')}
                        </ModeratorLabel> }
                    </LabelContainer>}
                </ParticipantDetailsContainer>
                { <ParticipantActions children = { children } /> }
                <ParticipantStates>
                    { isParticipantBirthday && config.enableBirthdayARHat && <BirthdayIndicator /> }
                    { raisedHand && <RaisedHandIndicator /> }
                    { VideoStateIcons[videoMediaState] }
                    { AudioStateIcons[audioMediaState] }
                </ParticipantStates>
            </ParticipantContent>
        </ParticipantContainer>
    );
}

export default translate(ParticipantItem);
