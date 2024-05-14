// @ts-expect-error
import Logger from '@jitsi/logger';
import throttle from 'lodash/throttle';
import { PureComponent } from 'react';

import { createSharedVideoEvent as createEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { getCurrentConference } from '../../../base/conference/functions';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { getLocalParticipant } from '../../../base/participants/functions';
import { isLocalTrackMuted } from '../../../base/tracks/functions';
import { showWarningNotification } from '../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../../notifications/constants';
import { dockToolbox } from '../../../toolbox/actions';
import { muteLocal } from '../../../video-menu/actions.any';
import { setSharedVideoStatus, stopSharedVideo } from '../../actions.any';
import { PLAYBACK_STATUSES } from '../../constants';

const logger = Logger.getLogger(__filename);

/**
 * Return true if the difference between the two times is larger than 5.
 *
 * @param {number} newTime - The current time.
 * @param {number} previousTime - The previous time.
 * @private
 * @returns {boolean}
*/
function shouldSeekToPosition(newTime, previousTime) {
    return Math.abs(newTime - previousTime) > 5;
}

/**
 * Manager of shared video.
 */
class AbstractVideoManager extends PureComponent {
    throttledFireUpdateSharedVideoEvent;

    /**
     * Initializes a new instance of AbstractVideoManager.
     *
     * @param {IProps} props - Component props.
     * @returns {void}
     */
    constructor(props) {
        super(props);

        this.throttledFireUpdateSharedVideoEvent = throttle(this.fireUpdateSharedVideoEvent.bind(this), 5000);

        // selenium tests handler
        window._sharedVideoPlayer = this;
    }

    /**
     * Implements React Component's componentDidMount.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this.props._dockToolbox(true);
        this.processUpdatedProps();
    }

    /**
     * Implements React Component's componentDidUpdate.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps) {
        const { _videoUrl } = this.props;

        if (prevProps._videoUrl !== _videoUrl) {
            sendAnalytics(createEvent('started'));
        }

        this.processUpdatedProps();
    }

    /**
     * Implements React Component's componentWillUnmount.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        sendAnalytics(createEvent('stopped'));

        if (this.dispose) {
            this.dispose();
        }

        this.props._dockToolbox(false);
    }

    /**
     * Processes new properties.
     *
     * @returns {void}
     */
    processUpdatedProps() {
        const { _status, _time, _isOwner, _muted } = this.props;

        if (_isOwner) {
            return;
        }

        const playerTime = this.getTime();

        if (shouldSeekToPosition(Number(_time), Number(playerTime))) {
            this.seek(Number(_time));
        }

        if (this.getPlaybackStatus() !== _status) {
            if (_status === PLAYBACK_STATUSES.PLAYING) {
                this.play();
            }

            if (_status === PLAYBACK_STATUSES.PAUSED) {
                this.pause();
            }
        }

        if (this.isMuted() !== _muted) {
            if (_muted) {
                this.mute();
            } else {
                this.unMute();
            }
        }
    }

    /**
     * Handle video error.
     *
     * @param {Object|undefined} e - The error returned by the API or none.
     * @returns {void}
     */
    onError(e) {
        logger.error('Error in the video player', e?.data,
            e?.data ? 'Check error code at https://developers.google.com/youtube/iframe_api_reference#onError' : '');
        this.props._stopSharedVideo();
        this.props._displayWarning();
    }

    /**
     * Handle video playing.
     *
     * @returns {void}
     */
    onPlay() {
        this.smartAudioMute();
        sendAnalytics(createEvent('play'));
        this.fireUpdateSharedVideoEvent();
    }

    /**
     * Handle video paused.
     *
     * @returns {void}
     */
    onPause() {
        sendAnalytics(createEvent('paused'));
        this.fireUpdateSharedVideoEvent();
    }

    /**
     * Handle volume changed.
     *
     * @returns {void}
     */
    onVolumeChange() {
        const volume = this.getVolume();
        const muted = this.isMuted();

        if (Number(volume) > 0 && !muted) {
            this.smartAudioMute();
        }

        sendAnalytics(createEvent(
            'volume.changed',
            {
                volume,
                muted
            }));

        this.fireUpdatePlayingVideoEvent();
    }

    /**
     * Handle changes to the shared playing video.
     *
     * @returns {void}
     */
    fireUpdatePlayingVideoEvent() {
        if (this.getPlaybackStatus() === PLAYBACK_STATUSES.PLAYING) {
            this.fireUpdateSharedVideoEvent();
        }
    }

    /**
     * Dispatches an update action for the shared video.
     *
     * @returns {void}
     */
    fireUpdateSharedVideoEvent() {
        const { _isOwner } = this.props;

        if (!_isOwner) {
            return;
        }

        const status = this.getPlaybackStatus();

        if (!Object.values(PLAYBACK_STATUSES).includes(status ?? '')) {
            return;
        }

        const {
            _ownerId,
            _setSharedVideoStatus,
            _videoUrl
        } = this.props;

        _setSharedVideoStatus({
            videoUrl: _videoUrl,
            status,
            time: this.getTime(),
            ownerId: _ownerId,
            muted: this.isMuted()
        });
    }

    /**
     * Indicates if the player volume is currently on. This will return true if
     * we have an available player, which is currently in a PLAYING state,
     * which isn't muted and has it's volume greater than 0.
     *
     * @returns {boolean} Indicating if the volume of the shared video is
     * currently on.
     */
    isSharedVideoVolumeOn() {
        return this.getPlaybackStatus() === PLAYBACK_STATUSES.PLAYING
                && !this.isMuted()
                && Number(this.getVolume()) > 0;
    }

    /**
     * Smart mike mute. If the mike isn't currently muted and the shared video
     * volume is on we mute the mike.
     *
     * @returns {void}
     */
    smartAudioMute() {
        const { _isLocalAudioMuted, _muteLocal } = this.props;

        if (!_isLocalAudioMuted
            && this.isSharedVideoVolumeOn()) {
            sendAnalytics(createEvent('audio.muted'));
            _muteLocal(true);
        }
    }

    /**
     * Seeks video to provided time.
     *
     * @param {number} _time - Time to seek to.
     * @returns {void}
     */
    seek(_time) {
        // to be implemented by subclass
    }

    /**
     * Indicates the playback state of the video.
     *
     * @returns {string}
     */
    getPlaybackStatus() {
        return;
    }

    /**
     * Indicates whether the video is muted.
     *
     * @returns {boolean}
     */
    isMuted() {
        return;
    }

    /**
     * Retrieves current volume.
     *
     * @returns {number}
     */
    getVolume() {
        return 1;
    }

    /**
     * Plays video.
     *
     * @returns {void}
     */
    play() {
        // to be implemented by subclass
    }

    /**
     * Pauses video.
     *
     * @returns {void}
     */
    pause() {
        // to be implemented by subclass
    }

    /**
     * Mutes video.
     *
     * @returns {void}
     */
    mute() {
        // to be implemented by subclass
    }

    /**
     * Unmutes video.
     *
     * @returns {void}
     */
    unMute() {
        // to be implemented by subclass
    }

    /**
     * Retrieves current time.
     *
     * @returns {number}
     */
    getTime() {
        return 0;
    }

    /**
     * Disposes current video player.
     *
     * @returns {void}
     */
    dispose() {
        // to be implemented by subclass
    }
}


export default AbstractVideoManager;

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
export function _mapStateToProps(state) {
    const { ownerId, status, time, videoUrl, muted } = state['features/shared-video'];
    const localParticipant = getLocalParticipant(state);
    const _isLocalAudioMuted = isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.AUDIO);

    return {
        _conference: getCurrentConference(state),
        _isLocalAudioMuted,
        _isOwner: ownerId === localParticipant?.id,
        _muted: muted,
        _ownerId: ownerId,
        _status: status,
        _time: time,
        _videoUrl: videoUrl
    };
}

/**
 * Maps part of the props of this component to Redux actions.
 *
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {IProps}
 */
export function _mapDispatchToProps(dispatch) {
    return {
        _displayWarning: () => {
            dispatch(showWarningNotification({
                titleKey: 'dialog.shareVideoLinkError'
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));
        },
        _dockToolbox: (value) => {
            dispatch(dockToolbox(value));
        },
        _stopSharedVideo: () => {
            dispatch(stopSharedVideo());
        },
        _muteLocal: (value) => {
            dispatch(muteLocal(value, MEDIA_TYPE.AUDIO));
        },
        _setSharedVideoStatus: ({ videoUrl, status, time, ownerId, muted }) => {
            dispatch(setSharedVideoStatus({
                videoUrl,
                status,
                time,
                ownerId,
                muted
            }));
        }
    };
}
