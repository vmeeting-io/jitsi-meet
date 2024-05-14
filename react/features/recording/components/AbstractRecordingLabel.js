import React, { Component } from 'react';

import { JitsiRecordingConstants } from '../../base/lib-jitsi-meet';
import { isRecorderTranscriptionsRunning } from '../../transcribing/functions';
import {
    getActiveSession,
    getSessionStatusToShow,
    isRecordingRunning,
    isRemoteParticipantRecordingLocally
} from '../functions';

/**
 * Abstract class for the {@code RecordingLabel} component.
 */
export default class AbstractRecordingLabel extends Component {
    /**
     * Implements React {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        const { _iAmRecorder, _isVisible } = this.props;

        return _isVisible && !_iAmRecorder ? this._renderLabel() : null;
    }

    /**
     * Renders the platform specific label component.
     *
     * @protected
     * @returns {React$Element}
     */
    _renderLabel(): React.ReactNode | null {
        return null;
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code AbstractRecordingLabel}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {IProps} ownProps - The component's own props.
 * @private
 * @returns {{
 *     _status: ?string
 * }}
 */
export function _mapStateToProps(state, ownProps) {
    const { mode } = ownProps;
    const isLiveStreamingLabel = mode === JitsiRecordingConstants.mode.STREAM;
    const _isTranscribing = isRecorderTranscriptionsRunning(state);
    const isLivestreamingRunning = Boolean(getActiveSession(state, JitsiRecordingConstants.mode.STREAM));
    const _isVisible = isLiveStreamingLabel
        ? isLivestreamingRunning // this is the livestreaming label
        : isRecordingRunning(state) || isRemoteParticipantRecordingLocally(state)
            || _isTranscribing; // this is the recording label

    return {
        _isVisible,
        _iAmRecorder: Boolean(state['features/base/config'].iAmRecorder),
        _isTranscribing,
        _status: getSessionStatusToShow(state, mode)
    };
}
