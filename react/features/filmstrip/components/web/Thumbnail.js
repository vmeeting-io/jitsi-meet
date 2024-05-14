import { Theme } from '@mui/material';
import clsx from 'clsx';
import debounce from 'lodash/debounce';
import React, { Component, KeyboardEvent, RefObject, createRef } from 'react';
import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { createScreenSharingIssueEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import Avatar from '../../../base/avatar/components/Avatar';
import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n/functions';
import { JitsiTrackEvents } from '../../../base/lib-jitsi-meet';
import VideoTrack from '../../../base/media/components/web/VideoTrack';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { pinParticipant } from '../../../base/participants/actions';
import {
    getLocalParticipant,
    getParticipantByIdOrUndefined,
    getScreenshareParticipantIds,
    hasRaisedHand,
    isLocalScreenshareParticipant,
    isScreenShareParticipant,
    isWhiteboardParticipant
} from '../../../base/participants/functions';
import { ASPECT_RATIO_NARROW } from '../../../base/responsive-ui/constants';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import { trackStreamingStatusChanged } from '../../../base/tracks/actions';
import {
    getLocalAudioTrack,
    getTrackByMediaTypeAndParticipant,
    getVideoTrackByParticipant
} from '../../../base/tracks/functions';
import { getVideoObjectPosition } from '../../../face-landmarks/functions';
import PresenceLabel from '../../../presence-status/components/PresenceLabel';
import { LAYOUTS } from '../../../video-layout/constants';
import { getCurrentLayout } from '../../../video-layout/functions.web';
import { togglePinStageParticipant } from '../../actions';
import {
    DISPLAY_MODE_TO_CLASS_NAME,
    DISPLAY_VIDEO,
    FILMSTRIP_TYPE,
    SHOW_TOOLBAR_CONTEXT_MENU_AFTER,
    THUMBNAIL_TYPE
} from '../../constants';
import {
    computeDisplayModeFromInput,
    getActiveParticipantsIds,
    getDisplayModeInput,
    getThumbnailTypeFromLayout,
    isStageFilmstripAvailable,
    isVideoPlayable,
    showGridInVerticalView
} from '../../functions';

import ThumbnailAudioIndicator from './ThumbnailAudioIndicator';
import ThumbnailBottomIndicators from './ThumbnailBottomIndicators';
import ThumbnailTopIndicators from './ThumbnailTopIndicators';
import VirtualScreenshareParticipant from './VirtualScreenshareParticipant';

const defaultStyles = (theme: Theme) => {
    return {
        indicatorsContainer: {
            position: 'absolute',
            padding: theme.spacing(1),
            zIndex: 10,
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            left: 0,

            '&.tile-view-mode': {
                padding: theme.spacing(2)
            }
        },

        indicatorsTopContainer: {
            top: 0,
            justifyContent: 'space-between'
        },

        indicatorsBottomContainer: {
            bottom: 0
        },

        indicatorsBackground: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            maxWidth: '100%',
            overflow: 'hidden',

            '&:not(:empty)': {
                padding: '4px 8px'
            },

            '& > *:not(:last-child)': {
                marginRight: '8px'
            }
        },

        containerBackground: {
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            borderRadius: '4px',
            backgroundColor: theme.palette.ui02
        },

        borderIndicator: {
            position: 'absolute',
            width: '100%',
            height: '100%',
            zIndex: 9,
            borderRadius: '4px',
            pointerEvents: 'none'
        },

        borderIndicatorOnTop: {
            zIndex: 11
        },

        activeSpeaker: {
            '& .active-speaker-indicator': {
                boxShadow: `inset 0px 0px 0px 3px ${theme.palette.action01Hover} !important`
            }
        },

        raisedHand: {
            '& .raised-hand-border': {
                boxShadow: `inset 0px 0px 0px 2px ${theme.palette.warning02} !important`
            }
        },

        tintBackground: {
            position: 'absolute',
            zIndex: 1,
            width: '100%',
            height: '100%',
            backgroundColor: `${theme.palette.uiBackground}`,
            opacity: 0.3
        },

        keyboardPinButton: {
            position: 'absolute',
            zIndex: 10,

            /* this button is only for keyboard/screen reader users,
            an onClick handler is already set elsewhere for mouse users, so make sure
            we can't click on it */
            pointerEvents: 'none',

            // make room for the border to correctly show up
            left: '3px',
            right: '3px',
            bottom: '3px',
            top: '3px'
        }
    };
};

/**
 * Implements a thumbnail.
 *
 * @augments Component
 */
class Thumbnail extends Component {
    /**
     * The long touch setTimeout handler.
     */
    timeoutHandle;

    /**
     * Ref to the container of the thumbnail.
     */
    containerRef;

    /**
     * Timeout used to detect double tapping.
     * It is active while user has tapped once.
     */
    _firstTap;

    /**
     * Initializes a new Thumbnail instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        const state = {
            canPlayEventReceived: false,
            displayMode: DISPLAY_VIDEO,
            popoverVisible: false,
            isHovered: false
        };

        this.state = {
            ...state,
            displayMode: computeDisplayModeFromInput(getDisplayModeInput(props, state))
        };
        this.timeoutHandle = undefined;
        this.containerRef = createRef();
        this._clearDoubleClickTimeout = this._clearDoubleClickTimeout.bind(this);
        this._onCanPlay = this._onCanPlay.bind(this);
        this._onClick = this._onClick.bind(this);
        this._onTogglePinButtonKeyDown = this._onTogglePinButtonKeyDown.bind(this);
        this._onFocus = this._onFocus.bind(this);
        this._onBlur = this._onBlur.bind(this);
        this._onMouseEnter = this._onMouseEnter.bind(this);
        this._onMouseMove = debounce(this._onMouseMove.bind(this), 100, {
            leading: true,
            trailing: false
        });
        this._onMouseLeave = this._onMouseLeave.bind(this);
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._showPopover = this._showPopover.bind(this);
        this._hidePopover = this._hidePopover.bind(this);
        this.handleTrackStreamingStatusChanged = this.handleTrackStreamingStatusChanged.bind(this);
    }

    /**
     * Starts listening for track streaming status updates after the initial render.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._onDisplayModeChanged();


        // Listen to track streaming status changed event to keep it updated.
        // TODO: after converting this component to a react function component,
        // use a custom hook to update local track streaming status.
        const { _videoTrack, dispatch } = this.props;

        if (_videoTrack && !_videoTrack.local) {
            _videoTrack.jitsiTrack.on(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                this.handleTrackStreamingStatusChanged);
            dispatch(trackStreamingStatusChanged(_videoTrack.jitsiTrack,
                _videoTrack.jitsiTrack.getTrackStreamingStatus()));
        }
    }

    /**
     * Remove listeners for track streaming status update.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        // TODO: after converting this component to a react function component,
        // use a custom hook to update local track streaming status.
        const { _videoTrack, dispatch } = this.props;

        if (_videoTrack && !_videoTrack.local) {
            _videoTrack.jitsiTrack.off(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                this.handleTrackStreamingStatusChanged);
            dispatch(trackStreamingStatusChanged(_videoTrack.jitsiTrack,
                _videoTrack.jitsiTrack.getTrackStreamingStatus()));
        }
    }

    /**
     * Stops listening for track streaming status updates on the old track and starts
     * listening instead on the new track.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(prevProps, prevState) {
        if (prevState.displayMode !== this.state.displayMode) {
            this._onDisplayModeChanged();
        }

        // TODO: after converting this component to a react function component,
        // use a custom hook to update local track streaming status.
        const { _videoTrack, dispatch } = this.props;

        if (prevProps._videoTrack?.jitsiTrack?.getSourceName() !== _videoTrack?.jitsiTrack?.getSourceName()) {
            if (prevProps._videoTrack && !prevProps._videoTrack.local) {
                prevProps._videoTrack.jitsiTrack.off(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                    this.handleTrackStreamingStatusChanged);
                dispatch(trackStreamingStatusChanged(prevProps._videoTrack.jitsiTrack,
                    prevProps._videoTrack.jitsiTrack.getTrackStreamingStatus()));
            }
            if (_videoTrack && !_videoTrack.local) {
                _videoTrack.jitsiTrack.on(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                    this.handleTrackStreamingStatusChanged);
                dispatch(trackStreamingStatusChanged(_videoTrack.jitsiTrack,
                    _videoTrack.jitsiTrack.getTrackStreamingStatus()));
            }
        }
    }

    /**
     * Handle track streaming status change event by
     * by dispatching an action to update track streaming status for the given track in app state.
     *
     * @param {JitsiTrack} jitsiTrack - The track with streaming status updated.
     * @param {JitsiTrackStreamingStatus} streamingStatus - The updated track streaming status.
     * @returns {void}
     */
    handleTrackStreamingStatusChanged(jitsiTrack, streamingStatus) {
        this.props.dispatch(trackStreamingStatusChanged(jitsiTrack, streamingStatus));
    }

    /**
     * Handles display mode changes.
     *
     * @returns {void}
     */
    _onDisplayModeChanged() {
        const input = getDisplayModeInput(this.props, this.state);

        this._maybeSendScreenSharingIssueEvents(input);
    }

    /**
     * Sends screen sharing issue event if an issue is detected.
     *
     * @param {Object} input - The input used to compute the thumbnail display mode.
     * @returns {void}
     */
    _maybeSendScreenSharingIssueEvents(input) {
        const {
            _isAudioOnly,
            _isScreenSharing,
            _thumbnailType
        } = this.props;
        const { displayMode } = this.state;
        const isTileType = _thumbnailType === THUMBNAIL_TYPE.TILE;

        if (!(DISPLAY_VIDEO === displayMode)
            && isTileType
            && _isScreenSharing
            && !_isAudioOnly) {
            sendAnalytics(createScreenSharingIssueEvent({
                source: 'thumbnail',
                ...input
            }));
        }
    }

    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props, prevState) {
        if (!props._videoTrack && prevState.canPlayEventReceived) {
            const newState = {
                ...prevState,
                canPlayEventReceived: false
            };

            return {
                ...newState,
                displayMode: computeDisplayModeFromInput(getDisplayModeInput(props, newState))
            };
        }

        const newDisplayMode = computeDisplayModeFromInput(getDisplayModeInput(props, prevState));

        if (newDisplayMode !== prevState.displayMode) {
            return {
                ...prevState,
                displayMode: newDisplayMode
            };
        }

        return null;
    }

    /**
     * Clears the first click timeout.
     *
     * @returns {void}
     */
    _clearDoubleClickTimeout() {
        clearTimeout(this._firstTap);
        this._firstTap = undefined;
    }

    /**
     * Shows popover.
     *
     * @private
     * @returns {void}
     */
    _showPopover() {
        this.setState({
            popoverVisible: true
        });
    }

    /**
     * Hides popover.
     *
     * @private
     * @returns {void}
     */
    _hidePopover() {
        const { _thumbnailType } = this.props;

        if (_thumbnailType === THUMBNAIL_TYPE.VERTICAL) {
            this.setState({
                isHovered: false
            });
        }
        this.setState({
            popoverVisible: false
        });
    }

    /**
     * Returns the size the avatar should have.
     *
     * @returns {number}
     */
    _getAvatarSize() {
        const { _height, _width } = this.props;

        return Math.min(_height / 2, _width - 30, 200);
    }

    /**
     * Returns an object with the styles for thumbnail.
     *
     * @returns {Object} - The styles for the thumbnail.
     */
    _getStyles() {
        const { canPlayEventReceived } = this.state;
        const {
            _disableTileEnlargement,
            _height,
            _isVirtualScreenshareParticipant,
            _isHidden,
            _isScreenSharing,
            _participant,
            _thumbnailType,
            _videoObjectPosition,
            _videoTrack,
            _width,
            horizontalOffset,
            style
        } = this.props;

        const isTileType = _thumbnailType === THUMBNAIL_TYPE.TILE;
        const jitsiVideoTrack = _videoTrack?.jitsiTrack;
        const track = jitsiVideoTrack?.track;
        const isPortraitVideo = (track?.getSettings()?.aspectRatio || 1) < 1;

        let styles = {
            thumbnail: {},
            avatar: {},
            video: {}
        };

        const avatarSize = this._getAvatarSize();
        let { left } = style || {};

        if (typeof left === 'number' && horizontalOffset) {
            left += horizontalOffset;
        }

        let videoStyles = null;
        const doNotStretchVideo = (isPortraitVideo && isTileType)
            || _disableTileEnlargement
            || _isScreenSharing;

        if (canPlayEventReceived || _participant.local || _isVirtualScreenshareParticipant) {
            videoStyles = {
                objectFit: doNotStretchVideo ? 'contain' : 'cover'
            };
        } else {
            videoStyles = {
                display: 'none'
            };
        }

        if (videoStyles.objectFit === 'cover') {
            videoStyles.objectPosition = _videoObjectPosition;
        }

        styles = {
            thumbnail: {
                ...style,
                left,
                height: `${_height}px`,
                minHeight: `${_height}px`,
                minWidth: `${_width}px`,
                width: `${_width}px`
            },
            avatar: {
                height: `${avatarSize}px`,
                width: `${avatarSize}px`
            },
            video: videoStyles
        };

        if (_isHidden) {
            styles.thumbnail.display = 'none';
        }

        return styles;
    }

    /**
     * On click handler.
     *
     * @returns {void}
     */
    _onClick() {
        const { _participant, dispatch, _stageFilmstripLayout } = this.props;
        const { id, pinned } = _participant;

        if (_stageFilmstripLayout) {
            dispatch(togglePinStageParticipant(id));
        } else {
            dispatch(pinParticipant(pinned ? null : id));
        }
    }

    /**
     * This is called as a onKeydown handler on the keyboard-only button to toggle pin.
     *
     * @param {KeyboardEvent} event - The keydown event.
     * @returns {void}
     */
    _onTogglePinButtonKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            this._onClick();
        }
    }

    /**
     * Keyboard focus handler.
     *
     * When navigating with keyboard, make things behave as we
     * hover with the mouse, to make the UI show up.
     *
     * @returns {void}
     */
    _onFocus() {
        this.setState({ isHovered: true });
    }

    /**
     * Keyboard blur handler.
     *
     * When navigating with keyboard, make things behave as we
     * hover with the mouse, to make the UI show up.
     *
     * @returns {void}
     */
    _onBlur() {
        // we need this timeout trick so that we get the actual document.activeElement value
        // instead of document.body
        setTimeout(() => {
            // we also explicitly check for popovers, because the thumbnail can show popovers,
            // and they are not rendered in the thumbnail DOM element
            if (
                !this.containerRef?.current?.contains(document.activeElement)
                && document.activeElement?.closest('.popover') === null
            ) {
                this.setState({ isHovered: false });
            }
        }, 0);
    }

    /**
     * Mouse enter handler.
     *
     * @returns {void}
     */
    _onMouseEnter() {
        this.setState({ isHovered: true });
    }

    /**
     * Mouse move handler.
     *
     * @returns {void}
     */
    _onMouseMove() {
        if (!this.state.isHovered) {
            // Workaround for the use case where the layout changes (for example the participant pane is closed)
            // and as a result the mouse appears on top of the thumbnail. In these use cases the mouse enter
            // event on the thumbnail is not triggered in Chrome.
            this.setState({ isHovered: true });
        }
    }

    /**
     * Mouse leave handler.
     *
     * @returns {void}
     */
    _onMouseLeave() {
        this.setState({ isHovered: false });
    }

    /**
     * Handler for touch start.
     *
     * @returns {void}
     */
    _onTouchStart() {
        this.timeoutHandle = window.setTimeout(this._showPopover, SHOW_TOOLBAR_CONTEXT_MENU_AFTER);

        if (this._firstTap) {
            this._clearDoubleClickTimeout();
            this._onClick();

            return;
        }

        this._firstTap = window.setTimeout(this._clearDoubleClickTimeout, 300);
    }

    /**
     * Cancel showing popover context menu after x milliseconds if the no. Of milliseconds is not reached yet,
     * or just clears the timeout.
     *
     * @returns {void}
     */
    _onTouchEnd() {
        clearTimeout(this.timeoutHandle);
    }

    /**
     * Cancel showing Context menu after x milliseconds if the number of milliseconds is not reached
     * before a touch move(drag), or just clears the timeout.
     *
     * @returns {void}
     */
    _onTouchMove() {
        clearTimeout(this.timeoutHandle);
    }

    /**
     * Renders a fake participant (youtube video) thumbnail.
     *
     * @param {string} id - The id of the participant.
     * @returns {ReactElement}
     */
    _renderFakeParticipant() {
        const { _isMobile, _participant: { avatarURL, pinned, name } } = this.props;
        const styles = this._getStyles();
        const containerClassName = this._getContainerClassName();

        return (
            <span
                aria-label = { this.props.t(pinned ? 'unpinParticipant' : 'pinParticipant', {
                    participantName: name
                }) }
                className = { containerClassName }
                id = 'sharedVideoContainer'
                onClick = { this._onClick }
                onKeyDown = { this._onTogglePinButtonKeyDown }
                { ...(_isMobile ? {} : {
                    onMouseEnter: this._onMouseEnter,
                    onMouseMove: this._onMouseMove,
                    onMouseLeave: this._onMouseLeave
                }) }
                role = 'button'
                style = { styles.thumbnail }
                tabIndex = { 0 }>
                {avatarURL ? (
                    <img
                        alt = ''
                        className = 'sharedVideoAvatar'
                        src = { avatarURL } />
                )
                    : this._renderAvatar(styles.avatar)}
            </span>
        );
    }

    /**
     * Renders the avatar.
     *
     * @param {Object} styles - The styles that will be applied to the avatar.
     * @returns {ReactElement}
     */
    _renderAvatar(styles) {
        const { _participant } = this.props;
        const { id } = _participant;

        return (
            <div
                className = 'avatar-container'
                style = { styles }>
                <Avatar
                    className = 'userAvatar'
                    participantId = { id }
                    size = { this._getAvatarSize() } />
            </div>
        );
    }

    /**
     * Returns the container class name.
     *
     * @returns {string} - The class name that will be used for the container.
     */
    _getContainerClassName() {
        let className = 'videocontainer';
        const { displayMode } = this.state;
        const {
            _isDominantSpeakerDisabled,
            _participant,
            _raisedHand,
            _thumbnailType
        } = this.props;
        const classes = withStyles.getClasses(this.props);

        className += ` ${DISPLAY_MODE_TO_CLASS_NAME[displayMode]}`;

        if (_raisedHand) {
            className += ` ${classes.raisedHand}`;
        }

        if (!_isDominantSpeakerDisabled && _participant?.dominantSpeaker) {
            className += ` ${classes.activeSpeaker} dominant-speaker`;
        }
        if (_thumbnailType !== THUMBNAIL_TYPE.TILE && _participant?.pinned) {
            className += ' videoContainerFocused';
        }

        return className;
    }

    /**
     * Canplay event listener.
     *
     * @returns {void}
     */
    _onCanPlay() {
        this.setState({ canPlayEventReceived: true });
    }

    /**
     * Renders a remote participant's 'thumbnail.
     *
     * @param {boolean} local - Whether or not it's the local participant.
     * @returns {ReactElement}
     */
    _renderParticipant(local = false) {
        const {
            _audioTrack,
            _disableLocalVideoFlip,
            _isMobile,
            _isMobilePortrait,
            _isScreenSharing,
            _localFlipX,
            _participant,
            _shouldDisplayTintBackground,
            _thumbnailType,
            _videoTrack,
            filmstripType,
            t
        } = this.props;
        const classes = withStyles.getClasses(this.props);
        const { id, name, pinned } = _participant || {};
        const { isHovered, popoverVisible } = this.state;
        const styles = this._getStyles();
        let containerClassName = this._getContainerClassName();
        const videoTrackClassName
            = !_disableLocalVideoFlip && _videoTrack && !_isScreenSharing && _localFlipX ? 'flipVideoX' : '';
        const jitsiVideoTrack = _videoTrack?.jitsiTrack;
        const videoTrackId = jitsiVideoTrack?.getId();
        const videoEventListeners = {};
        const pinButtonLabel = t(pinned ? 'unpinParticipant' : 'pinParticipant', {
            participantName: name
        });

        if (local) {
            if (_isMobilePortrait) {
                styles.thumbnail.height = styles.thumbnail.width;
                containerClassName = `${containerClassName} self-view-mobile-portrait`;
            }
        } else {
            videoEventListeners.onCanPlay = this._onCanPlay;
        }

        const video = _videoTrack && <VideoTrack
            className = { local ? videoTrackClassName : '' }
            eventHandlers = { videoEventListeners }
            id = { local ? 'localVideo_container' : `remoteVideo_${videoTrackId || ''}` }
            muted = { local ? undefined : true }
            style = { styles.video }
            videoTrack = { _videoTrack } />;

        return (
            <span
                className = { containerClassName }
                id = { local
                    ? `localVideoContainer${filmstripType === FILMSTRIP_TYPE.MAIN ? '' : `_${filmstripType}`}`
                    : `participant_${id}${filmstripType === FILMSTRIP_TYPE.MAIN ? '' : `_${filmstripType}`}`
                }
                onBlur = { this._onBlur }
                onFocus = { this._onFocus }
                { ...(_isMobile
                    ? {
                        onTouchEnd: this._onTouchEnd,
                        onTouchMove: this._onTouchMove,
                        onTouchStart: this._onTouchStart
                    }
                    : {
                        onClick: this._onClick,
                        onMouseEnter: this._onMouseEnter,
                        onMouseMove: this._onMouseMove,
                        onMouseLeave: this._onMouseLeave
                    }
                ) }
                ref = { this.containerRef }
                style = { styles.thumbnail }>
                {/* this "button" is invisible, only here so that
                keyboard/screen reader users can pin/unpin */}
                <Tooltip
                    content = { pinButtonLabel }>
                    <span
                        aria-label = { pinButtonLabel }
                        className = { classes.keyboardPinButton }
                        onKeyDown = { this._onTogglePinButtonKeyDown }
                        role = 'button'
                        tabIndex = { 0 } />
                </Tooltip>
                {(local
                    ? <span id = 'localVideoWrapper'>{video}</span>
                    : video)}
                <div className = { classes.containerBackground } />
                {/* put the bottom container before the top container in the dom,
                because it contains the participant name that should be announced first by screen readers */}
                <div
                    className = { clsx(classes.indicatorsContainer,
                        classes.indicatorsBottomContainer,
                        _thumbnailType === THUMBNAIL_TYPE.TILE && 'tile-view-mode'
                    ) }>
                    <ThumbnailBottomIndicators
                        className = { classes.indicatorsBackground }
                        local = { local }
                        participantId = { id }
                        showStatusIndicators = { !isWhiteboardParticipant(_participant) }
                        thumbnailType = { _thumbnailType } />
                </div>
                <div
                    className = { clsx(classes.indicatorsContainer,
                        classes.indicatorsTopContainer,
                        _thumbnailType === THUMBNAIL_TYPE.TILE && 'tile-view-mode'
                    ) }>
                    <ThumbnailTopIndicators
                        disableConnectionIndicator = { isWhiteboardParticipant(_participant) }
                        hidePopover = { this._hidePopover }
                        indicatorsClassName = { classes.indicatorsBackground }
                        isHovered = { isHovered }
                        local = { local }
                        participantId = { id }
                        popoverVisible = { popoverVisible }
                        showPopover = { this._showPopover }
                        thumbnailType = { _thumbnailType } />
                </div>
                {_shouldDisplayTintBackground && <div className = { classes.tintBackground } />}
                { this._renderAvatar(styles.avatar) }
                { !local && (
                    <div className = 'presence-label-container'>
                        <PresenceLabel
                            className = 'presence-label'
                            participantID = { id } />
                    </div>
                )}
                <ThumbnailAudioIndicator _audioTrack = { _audioTrack } />
                <div
                    className = { clsx(classes.borderIndicator,
                    'raised-hand-border') } />
                <div
                    className = { clsx(classes.borderIndicator,
                    'active-speaker-indicator') } />
            </span>
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _isVirtualScreenshareParticipant,
            _participant,
            _shouldDisplayTintBackground
        } = this.props;

        if (!_participant) {
            return null;
        }

        const { fakeParticipant, local } = _participant;

        if (local) {
            return this._renderParticipant(true);
        }

        if (fakeParticipant
            && !isWhiteboardParticipant(_participant)
            && !_isVirtualScreenshareParticipant
        ) {
            return this._renderFakeParticipant();
        }

        if (_isVirtualScreenshareParticipant) {
            const { isHovered } = this.state;
            const { _videoTrack, _isMobile, _thumbnailType } = this.props;
            const classes = withStyles.getClasses(this.props);

            return (
                <VirtualScreenshareParticipant
                    classes = { classes }
                    containerClassName = { this._getContainerClassName() }
                    isHovered = { isHovered }
                    isLocal = { isLocalScreenshareParticipant(_participant) }
                    isMobile = { _isMobile }
                    onClick = { this._onClick }
                    onMouseEnter = { this._onMouseEnter }
                    onMouseLeave = { this._onMouseLeave }
                    onMouseMove = { this._onMouseMove }
                    onTouchEnd = { this._onTouchEnd }
                    onTouchMove = { this._onTouchMove }
                    onTouchStart = { this._onTouchStart }
                    participantId = { _participant.id }
                    shouldDisplayTintBackground = { _shouldDisplayTintBackground }
                    styles = { this._getStyles() }
                    thumbnailType = { _thumbnailType }
                    videoTrack = { _videoTrack } />
            );
        }

        return this._renderParticipant();
    }
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
    const { participantID, filmstripType = FILMSTRIP_TYPE.MAIN } = ownProps;

    const participant = getParticipantByIdOrUndefined(state, participantID);
    const id = participant?.id ?? '';
    const isLocal = participant?.local ?? true;
    const _isVirtualScreenshareParticipant = isScreenShareParticipant(participant);
    const tracks = state['features/base/tracks'];
    const _videoTrack = getVideoTrackByParticipant(state, participant);
    const _audioTrack = isLocal
        ? getLocalAudioTrack(tracks)
        : getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, id);
    const _currentLayout = getCurrentLayout(state) ?? '';
    let size = {};
    let _isMobilePortrait = false;
    const {
        defaultLocalDisplayName,
        disableLocalVideoFlip,
        disableTileEnlargement,
        iAmRecorder,
        iAmSipGateway
    } = state['features/base/config'];
    const { localFlipX } = state['features/base/settings'];
    const _isMobile = isMobileBrowser();
    const activeParticipants = getActiveParticipantsIds(state);
    const tileType = getThumbnailTypeFromLayout(_currentLayout, filmstripType);

    switch (tileType) {
    case THUMBNAIL_TYPE.VERTICAL:
    case THUMBNAIL_TYPE.HORIZONTAL: {
        const {
            horizontalViewDimensions = {
                local: { width: undefined,
                    height: undefined },
                remote: { width: undefined,
                    height: undefined }
            },
            verticalViewDimensions = {
                local: { width: undefined,
                    height: undefined },
                remote: { width: undefined,
                    height: undefined },
                gridView: {}
            }
        } = state['features/filmstrip'];
        const _verticalViewGrid = showGridInVerticalView(state);
        const { local, remote }
            = tileType === THUMBNAIL_TYPE.VERTICAL
                ? verticalViewDimensions : horizontalViewDimensions;

        const { width, height } = (isLocal ? local : remote) ?? { width: undefined,
            height: undefined };

        size = {
            _width: width,
            _height: height
        };

        if (_verticalViewGrid) {
            // @ts-ignore
            const { width: _width, height: _height } = verticalViewDimensions.gridView.thumbnailSize;

            size = {
                _width,
                _height
            };
        }

        _isMobilePortrait = _isMobile && state['features/base/responsive-ui'].aspectRatio === ASPECT_RATIO_NARROW;

        break;
    }
    case THUMBNAIL_TYPE.TILE: {
        const { thumbnailSize } = state['features/filmstrip'].tileViewDimensions ?? { thumbnailSize: undefined };
        const {
            stageFilmstripDimensions = {
                thumbnailSize: {
                    height: undefined,
                    width: undefined
                }
            },
            screenshareFilmstripDimensions = {
                thumbnailSize: {
                    height: undefined,
                    width: undefined
                }
            }
        } = state['features/filmstrip'];

        size = {
            _width: thumbnailSize?.width,
            _height: thumbnailSize?.height
        };

        if (filmstripType === FILMSTRIP_TYPE.STAGE) {
            const { width: _width, height: _height } = stageFilmstripDimensions.thumbnailSize ?? {
                width: undefined,
                height: undefined };

            size = {
                _width,
                _height
            };
        } else if (filmstripType === FILMSTRIP_TYPE.SCREENSHARE) {
            const { width: _width, height: _height } = screenshareFilmstripDimensions.thumbnailSize ?? {
                width: undefined,
                height: undefined
            };

            size = {
                _width,
                _height
            };
        }
        break;
    }
    }

    if (ownProps.width) {
        size._width = ownProps.width;
    }

    const participantId = isLocal ? getLocalParticipant(state)?.id : participantID;
    const isActiveParticipant = activeParticipants.find((pId) => pId === participantId);
    const participantCurrentlyOnLargeVideo = state['features/large-video']?.participantId === id;
    const screenshareParticipantIds = getScreenshareParticipantIds(state);

    const shouldDisplayTintBackground
        = _currentLayout !== LAYOUTS.TILE_VIEW && filmstripType === FILMSTRIP_TYPE.MAIN
        && (isActiveParticipant || participantCurrentlyOnLargeVideo)

        // skip showing tint for owner participants that are screensharing.
        && !screenshareParticipantIds.includes(id);

    return {
        _audioTrack,
        _currentLayout,
        _defaultLocalDisplayName: defaultLocalDisplayName,
        _disableLocalVideoFlip: Boolean(disableLocalVideoFlip),
        _disableTileEnlargement: Boolean(disableTileEnlargement),
        _isActiveParticipant: isActiveParticipant,
        _isHidden: isLocal && iAmRecorder && !iAmSipGateway,
        _isAudioOnly: Boolean(state['features/base/audio-only'].enabled),
        _isCurrentlyOnLargeVideo: participantCurrentlyOnLargeVideo,
        _isDominantSpeakerDisabled: interfaceConfig.DISABLE_DOMINANT_SPEAKER_INDICATOR,
        _isMobile,
        _isMobilePortrait,
        _isScreenSharing: _videoTrack?.videoType === 'desktop',
        _isVideoPlayable: id && isVideoPlayable(state, id),
        _isVirtualScreenshareParticipant,
        _localFlipX: Boolean(localFlipX),
        _participant: participant,
        _raisedHand: hasRaisedHand(participant),
        _stageFilmstripLayout: isStageFilmstripAvailable(state),
        _stageParticipantsVisible: _currentLayout === LAYOUTS.STAGE_FILMSTRIP_VIEW,
        _shouldDisplayTintBackground: shouldDisplayTintBackground,
        _thumbnailType: tileType,
        _videoObjectPosition: getVideoObjectPosition(state, participant?.id),
        _videoTrack,
        ...size,
    };
}

export default connect(_mapStateToProps)(withStyles(translate(Thumbnail), defaultStyles));
