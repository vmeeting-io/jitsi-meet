// @flow

import React from 'react';
import type { Node } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

import { Avatar } from '../../../base/avatar';
import { MEDIA_STATE, type MediaState, AudioStateIcons, VideoStateIcons } from '../../constants';

import { RaisedHandIndicator } from './RaisedHandIndicator';
import styles from './styles';

type Props = {

    /**
     * Media state for audio
     */
    audioMediaState: MediaState,

    /**
     * React children
     */
    children?: Node,

    /**
     * The name of the participant. Used for showing lobby names.
     */
    displayName: string,
    
    /**
     * Flag to identify it participant is a moderator.
     */
    isModerator: boolean,

    /**
     * Is the participant waiting?
     */
    isKnockingParticipant: boolean,

    /**
     * True if the participant is local.
     */
    local: boolean,

    /**
     * Callback to be invoked on pressing the participant item.
     */
    onPress?: Function,

    /**
     * The ID of the participant.
     */
    participantID: string,

    /**
     * True if the participant have raised hand.
     */
    raisedHand: boolean,

    /**
     * Media state for video
     */
    videoMediaState: MediaState
}

/**
 * 
 * Truncate the string greater than certain text size.
 * 
 * @param {String} text String text to be truncated. 
 * @param {Integer} max Maximum length of the string
 * @returns 
 */
function shortName(text, max){
    return text.length > max ? text.substring(0,max-3) + "...": text;  
}

/**
 * Participant item.
 *
 * @returns {React$Element<any>}
 */
function ParticipantItem({
    children,
    displayName,
    isModerator,
    isKnockingParticipant,
    local,
    onPress,
    participantID,
    raisedHand,
    audioMediaState = MEDIA_STATE.NONE,
    videoMediaState = MEDIA_STATE.NONE
}: Props) {

    const { t } = useTranslation();
    const shortDisplayName = shortName(displayName,18);

    return (
        <View style = { styles.participantContainer } >
            <TouchableOpacity
                onPress = { onPress }
                style = { styles.participantContent }>
                <Avatar
                    className = 'participant-avatar'
                    participantId = { participantID }
                    size = { 32 } />
                <Text
                    numberOfLines = { 2 }
                    style = { styles.participantName }>
                    { local ? `${shortDisplayName} (${t('me')})` : shortDisplayName }
                    { isModerator &&<Text 
                        style = { styles.participantIsModerator }>
                        {`\nModerator`}
                    </Text> }
                </Text>
                {/* <Text
                    numberOfLines = { 1 }
                    style = { styles.participantIsModerator }>
                    { isModerator ? "(Moderator)" : "" }
                </Text> */}
                {
                    !isKnockingParticipant
                    && <>
                        {
                            raisedHand && <RaisedHandIndicator />
                        }
                        <View style = { styles.participantStatesContainer }>
                            <View style = { styles.participantStateVideo }>{VideoStateIcons[videoMediaState]}</View>
                            <View>{AudioStateIcons[audioMediaState]}</View>
                        </View>
                    </>
                }
            </TouchableOpacity>
            { !local && children }
        </View>
    );
}

export default ParticipantItem;
