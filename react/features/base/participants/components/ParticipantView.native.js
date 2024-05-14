// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';

import {
    isTrackStreamingStatusActive,
    isTrackStreamingStatusInactive
} from '../../../connection-indicator/functions';
import { SharedVideo } from '../../../shared-video/components/native';
import { Avatar } from '../../avatar';
import { translate } from '../../i18n';
import {
    MEDIA_TYPE,
    VideoTrack
} from '../../media';
import { Container, TintedView } from '../../react';
import type { StyleType } from '../../styles';
import { TestHint } from '../../testing/components';
import { getTrackByMediaTypeAndParticipant, getVideoTrackByParticipant } from '../../tracks';
import { getParticipantById } from '../functions';
import { FakeParticipant } from '../constants';

import styles from './styles';
import { isTrackStreamingStatusActive } from '../../../connection-indicator/functions';

/**
 * The type of the React {@link Component} props of {@link ParticipantView}.
 */
type Props = {

    /**
     * The connection status of the participant. Her video will only be rendered
     * if the connection status is 'active'; otherwise, the avatar will be
     * rendered. If undefined, 'active' is presumed.
     *
     * @private
     */
    _connectionStatus: string,

    /**
     * The type of participant if the participant which this component represents is fake.
     *
     * @private
     */
    _fakeParticipant: string,

    /**
     * The name of the participant which this component represents.
     *
     * @private
     */
    _participantName: string,

    /**
     * True if the video should be rendered, false otherwise.
     */
    _renderVideo: boolean,

    /**
     * The video Track of the participant with {@link #participantId}.
     */
    _videoTrack: Object,

    /**
     * The avatar size.
     */
    avatarSize: number,

    /**
     * Whether video should be disabled for his view.
     */
    disableVideo: ?boolean,

    /**
     * Callback to invoke when the {@code ParticipantView} is clicked/pressed.
     */
    onPress: Function,

    /**
     * The ID of the participant (to be) depicted by {@link ParticipantView}.
     *
     * @public
     */
    participantId: string,

    /**
     * The style, if any, to apply to {@link ParticipantView} in addition to its
     * default style.
     */
    style: Object,

    /**
     * The function to translate human-readable text.
     */
    t: Function,

    /**
     * If true, a tinting will be applied to the view, regardless of video or
     * avatar is rendered.
     */
    tintEnabled: boolean,

    /**
     * The style of the tinting when applied.
     */
    tintStyle: StyleType,

    /**
     * The test hint id which can be used to locate the {@code ParticipantView}
     * on the jitsi-meet-torture side. If not provided, the
     * {@code participantId} with the following format will be used:
     * {@code `org.postech.vmeeting.Participant#${participantId}`}
     */
    testHintId: ?string,

    /**
     * Indicates if the connectivity info label should be shown, if appropriate.
     * It will be shown in case the connection is interrupted.
     */
    useConnectivityInfoLabel: boolean,

    /**
     * The z-order of the {@link Video} of {@link ParticipantView} in the
     * stacking space of all {@code Video}s. For more details, refer to the
     * {@code zOrder} property of the {@code Video} class for React Native.
     */
    zOrder: number,

    /**
     * Indicates whether zooming (pinch to zoom and/or drag) is enabled.
     */
    zoomEnabled: boolean
};

/**
 * Implements a React Component which depicts a specific participant's avatar
 * and video.
 *
 * @augments Component
 */
class ParticipantView extends Component<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _fakeParticipant,
            _renderVideo: renderVideo,
            _videoTrack: videoTrack,
            disableVideo,
            onPress,
        } = this.props;

        const testHintId
            = this.props.testHintId
                ? this.props.testHintId
                : `org.postech.vmeeting.Participant#${this.props.participantId}`;

        const renderSharedVideo = _fakeParticipant && !disableVideo;

        return (
            <Container
                onClick = { renderVideo || renderSharedVideo ? undefined : onPress }
                style = {{
                    ...styles.participantView,
                    ...this.props.style
                }}
                touchFeedback = { false }>

                <TestHint
                    id = { testHintId }
                    onPress = { renderSharedVideo ? undefined : onPress }
                    value = '' />

                { renderSharedVideo && <SharedVideo /> }

                { !_fakeParticipant && renderVideo
                    && <VideoTrack
                        onPress = { onPress }
                        videoTrack = { videoTrack }
                        waitForVideoStarted = { false }
                        zOrder = { this.props.zOrder }
                        zoomEnabled = { this.props.zoomEnabled } /> }

                { !renderSharedVideo && !renderVideo
                    && <View style = { styles.avatarContainer }>
                        <Avatar
                            participantId = { this.props.participantId }
                            size = { this.props.avatarSize } />
                    </View> }

            </Container>
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated {@link ParticipantView}'s
 * props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The React {@code Component} props passed to the
 * associated (instance of) {@code ParticipantView}.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps) {
    const { disableVideo, participantId } = ownProps;
    const participant = getParticipantById(state, participantId);
    const videoTrack = getVideoTrackByParticipant(state, participant);
    let participantName;

    return {
        _isConnectionInactive: isTrackStreamingStatusInactive(videoTrack),
        _fakeParticipant: participant && participant.fakeParticipant,
        _participantName: participantName,
        _renderVideo: shouldRenderParticipantVideo(state, participantId) && !disableVideo,
        _videoTrack:
            getTrackByMediaTypeAndParticipant(
                state['features/base/tracks'],
                MEDIA_TYPE.VIDEO,
                participantId)
    };
}

/**
 * Returns true if the video of the participant should be rendered.
 * NOTE: This is currently only used on mobile.
 *
 * @param {Object|Function} stateful - Object or function that can be resolved
 * to the Redux state.
 * @param {string} id - The ID of the participant.
 * @returns {boolean}
 */
export function shouldRenderParticipantVideo(stateful: Object | Function, id: string) {
    const state = toState(stateful);
    const participant = getParticipantById(state, id);

    if (!participant) {
        return false;
    }

    /* First check if we have an unmuted video track. */
    const videoTrack
        = getTrackByMediaTypeAndParticipant(state['features/base/tracks'], MEDIA_TYPE.VIDEO, id);

    if (!shouldRenderVideoTrack(videoTrack, /* waitForVideoStarted */ false)) {
        return false;
    }

    /* Then check if the participant connection or track streaming status is active. */
    if (!videoTrack.local && !isTrackStreamingStatusActive(videoTrack)) {
        return false;
    }

    /* Then check if audio-only mode is not active. */
    const audioOnly = state['features/base/audio-only'].enabled;

    if (!audioOnly) {
        return true;
    }

    /* Last, check if the participant is sharing their screen and they are on stage. */
    const remoteScreenShares = state['features/video-layout'].remoteScreenShares || [];
    const largeVideoParticipantId = state['features/large-video'].participantId;
    const participantIsInLargeVideoWithScreen
        = participant.id === largeVideoParticipantId && remoteScreenShares.includes(participant.id);

    return participantIsInLargeVideoWithScreen;
}

export default translate(connect(_mapStateToProps)(ParticipantView));
