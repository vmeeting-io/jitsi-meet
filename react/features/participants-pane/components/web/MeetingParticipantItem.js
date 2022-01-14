// @flow

import React, { useCallback, useEffect, useState } from 'react';

import { translate } from '../../../base/i18n';
import { JitsiTrackEvents } from '../../../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../../../base/media';
import {
    getLocalParticipant,
    getParticipantByIdOrUndefined,
    getParticipantDisplayName,
    getPinnedParticipant,
    hasRaisedHand,
    isParticipantModerator
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import {
    getLocalAudioTrack,
    getTrackByMediaTypeAndParticipant,
    isParticipantAudioMuted,
    isParticipantVideoMuted
} from '../../../base/tracks';
import { getFollowMeModerator } from '../../../follow-me';
import { ACTION_TRIGGER, type MediaState, MEDIA_STATE } from '../../constants';
import {
    getParticipantAudioMediaState,
    getParticipantPresenterMediaState,
    getParticipantVideoMediaState,
    getQuickActionButtonType,
    isTodayParticipantBirthday,
    participantMatchesSearch
} from '../../functions';

import ParticipantActionEllipsis from './ParticipantActionEllipsis';
import ParticipantItem from './ParticipantItem';
import ParticipantQuickAction from './ParticipantQuickAction';

type Props = {

    /**
     *  Whether or not to enable the ai attention analysis
     */
    _aiAttentionAnalysisEnabled: Boolean,

    /**
     * Media state for audio.
     */
    _audioMediaState: MediaState,

    /**
     * The audio track related to the participant.
     */
    _audioTrack: ?Object,

    /**
     * Whether or not to disable the moderator indicator.
     */
    _disableModeratorIndicator: boolean,

    /**
     * The display name of the participant.
     */
    _displayName: string,

    /**
     * Whether or not moderation is supported.
     */
    _isModerationSupported: boolean,

    /**
     * Boolean value that denotes whether or not today is participant's birthday
     */
    _isParticipantBirthday: Boolean,

    /**
     * True if the participant is the local participant.
     */
    _local: boolean,

    /**
     * Whether or not the local participant is moderator.
     */
    _localModerator: boolean,

    /**
     * Whether or not the local participant is moderator.
     */
    _localModerator: boolean,

    /**
     * Shared video local participant owner.
     */
    _localVideoOwner: boolean,

    /**
     * Whether or not the participant name matches the search string.
     */
    _matchesSearch: boolean,

    /**
     * The participant.
     */
    _participant: Object,

    /**
     * The participant ID.
     *
     * NOTE: This ID may be different from participantID prop in the case when we pass undefined for the local
     * participant. In this case the local participant ID will be filled trough _participantID prop.
     */
    _participantID: string,

    /**
     * The type of button to be rendered for the quick action.
     */
    _quickActionButtonType: string,

    /**
     * True if the participant have raised hand.
     */
    _raisedHand: boolean,

    /**
     * Media state for video.
     */
    _videoMediaState: MediaState,

    /**
     * The translated ask unmute text for the qiuck action buttons.
     */
    askUnmuteText: string,

    /**
     * Is this item highlighted.
     */
    isHighlighted: boolean,

    /**
     * Callback used to open a confirmation dialog for audio muting.
     */
    muteAudio: Function,

    /**
     * Callback for the activation of this item's context menu.
     */
    onContextMenu: Function,

    /**
     * Callback for the mouse leaving this item.
     */
    onLeave: Function,

    /**
     * Callback used to open an actions drawer for a participant.
     */
    openDrawerForParticipant: Function,

    /**
     * True if an overflow drawer should be displayed.
     */
    overflowDrawer: boolean,

    /**
     * The aria-label for the ellipsis action.
     */
    participantActionEllipsisLabel: string,

    /**
     * The ID of the participant.
     */
    participantID: ?string,

    /**
     * The translate function.
     */
    t: Function,

    /**
     * The translated "you" text.
     */
    youText: string
};

/**
 * Implements the MeetingParticipantItem component.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactElement}
 */
function MeetingParticipantItem({
    _aiAttentionAnalysisEnabled,
    _askToUnmuteText,
    _audioMediaState,
    _audioTrack,
    _disableModeratorIndicator,
    _displayName,
    _followMeModerator,
    _isParticipantBirthday,
    _local,
    _localVideoOwner,
    _matchesSearch,
    _muteParticipantButtonText,
    _participant,
    _participantID,
    _presenterMediaState,
    _isPinned,
    _quickActionButtonType,
    _raisedHand,
    _videoMediaState,
    isHighlighted,
    muteAudio,
    onContextMenu,
    onLeave,
    openDrawerForParticipant,
    overflowDrawer,
    participantActionEllipsisLabel,
    t,
    youText
}: Props) {

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

                jitsiTrack && jitsiTrack.off(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, _updateAudioLevel);
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
            aiAttentionFlag = { _aiAttentionAnalysisEnabled }
            audioMediaState = { audioMediaState }
            disableModeratorIndicator = { _disableModeratorIndicator }
            displayName = { _displayName }
            followMeModerator = { _followMeModerator }
            isHighlighted = { isHighlighted }
            isModerator = { isParticipantModerator(_participant) }
            isParticipantBirthday = { _isParticipantBirthday }
            isPinned = { _isPinned }
            local = { _local }
            onLeave = { onLeave }
            openDrawerForParticipant = { openDrawerForParticipant }
            overflowDrawer = { overflowDrawer }
            participantID = { _participantID }
            participantStatus = { _participant?.presence }
            pinEnabled = { true }
            presenterMediaState = { _presenterMediaState }
            raisedHand = { _raisedHand }
            videoMediaState = { _videoMediaState }
            youText = { youText }>

            {!overflowDrawer && !_local && !_participant?.isFakeParticipant
                && <>
                    <ParticipantQuickAction
                        askUnmuteText = { _askToUnmuteText }
                        buttonType = { _quickActionButtonType }
                        muteAudio = { muteAudio }
                        muteParticipantButtonText = { _muteParticipantButtonText }
                        participantID = { _participantID }
                        participantName = { _displayName } />
                    <ParticipantActionEllipsis
                        accessibilityLabel = { participantActionEllipsisLabel }
                        onClick = { onContextMenu } />
                </>
            }

            {!overflowDrawer && _local && (_isParticipantBirthday || isParticipantModerator(_participant)) && !_participant?.isFakeParticipant && (
                <ParticipantActionEllipsis
                    aria-label = { participantActionEllipsisLabel }
                    onClick = { onContextMenu } />
            )}

            {!overflowDrawer && _localVideoOwner && _participant?.isFakeParticipant && (
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
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps): Object {
    const { aiAttentionAnalysisEnabled } = state['features/base/settings'];
    const { askUnmuteText, participantID, searchString, t } = ownProps;
    const { ownerId } = state['features/shared-video'];
    const localParticipantId = getLocalParticipant(state).id;

    const participant = getParticipantByIdOrUndefined(state, participantID);
    const pinnedParticipant = getPinnedParticipant(state);

    const _displayName = getParticipantDisplayName(state, participant?.id);
    const _matchesSearch = participantMatchesSearch(participant, searchString);

    const _isAudioMuted = isParticipantAudioMuted(participant, state);
    const _isVideoMuted = isParticipantVideoMuted(participant, state);
    const _audioMediaState = getParticipantAudioMediaState(participant, _isAudioMuted, state);
    const _videoMediaState = getParticipantVideoMediaState(participant, _isVideoMuted, state);
    const _presenterMediaState = getParticipantPresenterMediaState(participant, state);
    const _quickActionButtonType = getQuickActionButtonType(participant, _isAudioMuted, state);

    const isParticipantBirthday = isTodayParticipantBirthday(participant)(state);
    const tracks = state['features/base/tracks'];
    const _audioTrack = participantID === localParticipantId
        ? getLocalAudioTrack(tracks) : getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, participantID);

    const { disableModeratorIndicator } = state['features/base/config'];

    const askToUnmuteText = askUnmuteText;

    const _muteParticipantButtonText = _isAudioMuted ? t('dialog.muteParticipantsVideoButton') : t('dialog.muteParticipantButton');

    return {
        _aiAttentionAnalysisEnabled: aiAttentionAnalysisEnabled,
        _askToUnmuteText: askToUnmuteText,
        _audioMediaState,
        _audioTrack,
        _disableModeratorIndicator: disableModeratorIndicator,
        _displayName,
        _followMeModerator: getFollowMeModerator(state),
        _isParticipantBirthday: isParticipantBirthday,
        _isPinned: participant === pinnedParticipant,
        _local: Boolean(participant?.local),
        _localVideoOwner: Boolean(ownerId === localParticipantId),
        _matchesSearch,
        _muteParticipantButtonText,
        _participant: participant,
        _participantID: participant?.id,
        _presenterMediaState,
        _quickActionButtonType,
        _raisedHand: hasRaisedHand(participant),
        _videoMediaState
    };
}

export default translate(connect(_mapStateToProps)(MeetingParticipantItem));
