import React, { ReactEventHandler } from 'react';
import { connect } from 'react-redux';

import AbstractVideoTrack from '../AbstractVideoTrack';

import Video from './Video';

/**
 * Component that renders a video element for a passed in video track and
 * notifies the store when the video has started playing.
 *
 * @augments AbstractVideoTrack
 */
class VideoTrack extends AbstractVideoTrack {
    /**
     * Default values for {@code VideoTrack} component's properties.
     *
     * @static
     */
    static defaultProps = {
        className: '',

        id: ''
    };

    /**
     * Renders the video element.
     *
     * @override
     * @returns {ReactElement}
     */
    render() {
        const {
            _noAutoPlayVideo,
            className,
            id,
            muted,
            videoTrack,
            style,
            eventHandlers
        } = this.props;

        return (

            <Video
                autoPlay = { !_noAutoPlayVideo }
                className = { className }
                eventHandlers = { eventHandlers }
                id = { id }
                muted = { muted }
                onVideoPlaying = { this._onVideoPlaying }
                style = { style }
                videoTrack = { videoTrack } />
        );
    }
}


/**
 * Maps (parts of) the Redux state to the associated VideoTracks props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _noAutoPlayVideo: boolean
 * }}
 */
function _mapStateToProps(state) {
    const testingConfig = state['features/base/config'].testing;

    return {
        _noAutoPlayVideo: Boolean(testingConfig?.noAutoPlayVideo)
    };
}

export default connect(_mapStateToProps)(VideoTrack);
