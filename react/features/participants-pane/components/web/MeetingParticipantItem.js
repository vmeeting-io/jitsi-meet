import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { JitsiTrackEvents } from '../../../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../../../base/media/constants';
import {
    getLocalParticipant,
    getParticipantByIdOrUndefined,
    getParticipantDisplayName,
    hasRaisedHand,
    isParticipantModerator
} from '../../../base/participants/functions';
import {
    getLocalAudioTrack,
    getTrackByMediaTypeAndParticipant,
    isParticipantAudioMuted,
    isParticipantVideoMuted
} from '../../../base/tracks/functions.web';
import { ACTION_TRIGGER, MEDIA_STATE } from '../../constants';
import {
    getParticipantAudioMediaState,
    getParticipantVideoMediaState,
    getQuickActionButtonType,
    participantMatchesSearch
} from '../../functions';

import ParticipantActionEllipsis from './ParticipantActionEllipsis';
import ParticipantItem from './ParticipantItem';
import ParticipantQuickAction from './ParticipantQuickAction';

/**
 * Implements the MeetingParticipantItem component.
 *
 * @param {IProps} props - The props of the component.
 * @returns {ReactElement}
 */
function MeetingParticipantItem({
    _audioMediaState,
    _audioTrack,
    _disableModeratorIndicator,
    _displayName,
    _local,
    _localVideoOwner,
    _matchesSearch,
    _participant,
    _participantID,
    _quickActionButtonType,
    _raisedHand,
    _videoMediaState,
    isHighlighted,
    isInBreakoutRoom,
    muteAudio,
    onContextMenu,
    onLeave,
    openDrawerForParticipant,
    overflowDrawer,
    participantActionEllipsisLabel,
    stopVideo,
    youText
}) {

    const [ hasAudioLevels, setHasAudioLevel ] = useState(false);
    const [ registeredEvent, setRegisteredEvent ] = useState(false);

    const _updateAudioLevel = useCallback(level => {
        const audioLevel = typeof level === 'number' && !isNaN(level)
            ? level : 0;

        setHasAudioLevel(audioLevel > 0.009);
    }, []);

    useEffect(() => {
        if (_audioTrack && !registeredEvent) {
            const { jitsiTrack } = _audioTrack;

            if (jitsiTrack) {
                jitsiTrack.on(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, _updateAudioLevel);
                setRegisteredEvent(true);
            }
        }

        return () => {
            if (_audioTrack && registeredEvent) {
                const { jitsiTrack } = _audioTrack;

                jitsiTrack?.off(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, _updateAudioLevel);
            }
        };
    }, [ _audioTrack ]);

    if (!_matchesSearch) {
        return null;
    }

    const audioMediaState = _audioMediaState === MEDIA_STATE.UNMUTED && hasAudioLevels
        ? MEDIA_STATE.DOMINANT_SPEAKER : _audioMediaState;

    return (
        <ParticipantItem
            actionsTrigger = { ACTION_TRIGGER.HOVER }
            {
                ...(_participant?.fakeParticipant ? {} : {
                    audioMediaState,
                    videoMediaState: _videoMediaState
                })
            }
            disableModeratorIndicator = { _disableModeratorIndicator }
            displayName = { _displayName }
            isHighlighted = { isHighlighted }
            isModerator = { isParticipantModerator(_participant) }
            local = { _local }
            onLeave = { onLeave }
            openDrawerForParticipant = { openDrawerForParticipant }
            overflowDrawer = { overflowDrawer }
            participantID = { _participantID }
            raisedHand = { _raisedHand }
            youText = { youText }>

            {!overflowDrawer && !_participant?.fakeParticipant
                && <>
                    {!isInBreakoutRoom && (
                        <ParticipantQuickAction
                            buttonType = { _quickActionButtonType }
                            muteAudio = { muteAudio }
                            participantID = { _participantID }
                            participantName = { _displayName }
                            stopVideo = { stopVideo } />
                    )}
                    <ParticipantActionEllipsis
                        accessibilityLabel = { participantActionEllipsisLabel }
                        onClick = { onContextMenu }
                        participantID = { _participantID } />
                </>
            }

            {!overflowDrawer && (_localVideoOwner || _participant?.fakeParticipant) && (
                <ParticipantActionEllipsis
                    accessibilityLabel = { participantActionEllipsisLabel }
                    onClick = { onContextMenu } />
            )}
        </ParticipantItem>
    );
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state, ownProps) {
    const { participantID, searchString } = ownProps;
    const { ownerId } = state['features/shared-video'];
    const localParticipantId = getLocalParticipant(state)?.id;

    const participant = getParticipantByIdOrUndefined(state, participantID);

    const _displayName = getParticipantDisplayName(state, participant?.id ?? '');

    const _matchesSearch = participantMatchesSearch(participant, searchString);

    const _isAudioMuted = Boolean(participant && isParticipantAudioMuted(participant, state));
    const _isVideoMuted = isParticipantVideoMuted(participant, state);
    const _audioMediaState = getParticipantAudioMediaState(participant, _isAudioMuted, state);
    const _videoMediaState = getParticipantVideoMediaState(participant, _isVideoMuted, state);
    const _quickActionButtonType = getQuickActionButtonType(participant, _isAudioMuted, _isVideoMuted, state);

    const tracks = state['features/base/tracks'];
    const _audioTrack = participantID === localParticipantId
        ? getLocalAudioTrack(tracks) : getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, participantID);

    const { disableModeratorIndicator } = state['features/base/config'];

    return {
        _audioMediaState,
        _audioTrack,
        _disableModeratorIndicator: Boolean(disableModeratorIndicator),
        _displayName,
        _local: Boolean(participant?.local),
        _localVideoOwner: Boolean(ownerId === localParticipantId),
        _matchesSearch,
        _participant: participant,
        _participantID: participant?.id ?? '',
        _quickActionButtonType,
        _raisedHand: hasRaisedHand(participant),
        _videoMediaState
    };
}

export default connect(_mapStateToProps)(MeetingParticipantItem);
