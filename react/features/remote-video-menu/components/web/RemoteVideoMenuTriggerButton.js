// @flow

import React, { Component } from 'react';

import { Icon, IconMenuThumb } from '../../../base/icons';
import { getLocalParticipant, getParticipantCount, PARTICIPANT_ROLE } from '../../../base/participants';
import { Popover } from '../../../base/popover';
import { connect } from '../../../base/redux';
import { shouldDisplayTileView } from '../../../video-layout';

import {
    GrantModeratorButton,
    MuteButton,
    MuteEveryoneElseButton,
    KickButton,
    PrivateMessageMenuButton,
    RemoteControlButton,
    RemoteVideoMenu,
    VolumeSlider
} from './';
import ChatDisableButton from './ChatDisableButton';
import AllChatDisableButton from './AllChatDisableButton';
import MoveToFirstButton from './MoveToFirstButton';
import MoveToLastButton from './MoveToLastButton';
import MuteVideoButton from './MuteVideoButton';
import MuteVideoEveryoneElseButton from './MuteVideoEveryoneElseButton';

declare var $: Object;
declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of
 * {@link RemoteVideoMenuTriggerButton}.
 */
type Props = {

    /**
     * Whether or not to display the kick button.
     */
    _disableKick: boolean,

    /**
     * Whether or not to display the remote mute buttons.
     */
    _disableRemoteMute: Boolean,

    /**
     * Whether or not the participant is a conference moderator.
     */
    _isModerator: boolean,

    /**
     * A value between 0 and 1 indicating the volume of the participant's
     * audio element.
     */
    initialVolumeValue: number,

    /**
     * Whether or not the participant is currently muted.
     */
    isAudioMuted: boolean,

    /**
     * Whether or not the participant video is currently muted.
     */
    isVideoMuted: boolean,

     /**
     * Callback to invoke when the popover has been displayed.
     */
    onMenuDisplay: Function,

    /**
     * Callback to invoke choosing to start a remote control session with
     * the participant.
     */
    onRemoteControlToggle: Function,

    /**
     * Callback to invoke when changing the level of the participant's
     * audio element.
     */
    onVolumeChange: Function,

    /**
     * The position relative to the trigger the remote menu should display
     * from. Valid values are those supported by AtlasKit
     * {@code InlineDialog}.
     */
    menuPosition: string,

    /**
     * The ID for the participant on which the remote video menu will act.
     */
    participantID: string,

    /**
     * The current state of the participant's remote control session.
     */
    remoteControlState: number
};

/**
 * React {@code Component} for displaying an icon associated with opening the
 * the {@code RemoteVideoMenu}.
 *
 * @extends {Component}
 */
class RemoteVideoMenuTriggerButton extends Component<Props> {
    /**
     * The internal reference to topmost DOM/HTML element backing the React
     * {@code Component}. Accessed directly for associating an element as
     * the trigger for a popover.
     *
     * @private
     * @type {HTMLDivElement}
     */
    _rootElement = null;

    /**
     * Initializes a new {#@code RemoteVideoMenuTriggerButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onShowRemoteMenu = this._onShowRemoteMenu.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const content = this._renderRemoteVideoMenu();

        if (!content) {
            return null;
        }

        return (
            <Popover
                content = { content }
                onPopoverOpen = { this._onShowRemoteMenu }
                position = { this.props.menuPosition }>
                <span
                    className = 'popover-trigger remote-video-menu-trigger'>
                    <Icon
                        size = '1em'
                        src = { IconMenuThumb }
                        title = 'Remote user controls' />
                </span>
            </Popover>
        );
    }

    _onShowRemoteMenu: () => void;

    /**
     * Opens the {@code RemoteVideoMenu}.
     *
     * @private
     * @returns {void}
     */
    _onShowRemoteMenu() {
        this.props.onMenuDisplay();
    }

    /**
     * Creates a new {@code RemoteVideoMenu} with buttons for interacting with
     * the remote participant.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderRemoteVideoMenu() {
        const {
            _disableGrantModerator,
            _disableKick,
            _disablePrivateMessage,
            _disableRemoteMute,
            _disableRemoteUnmute,
            _disableRemoteMuteVideo,
            _disableRemoteUnmuteVideo,
            _isModerator,
            _shouldDisplayTileView,
            _participantCount,
            initialVolumeValue,
            isAudioMuted,
            isFirst,
            isLast,
            isVideoMuted,
            onRemoteControlToggle,
            onVolumeChange,
            remoteControlState,
            participantID
        } = this.props;

        const buttons = [];

        if (_isModerator) {
            if (!_disableRemoteMute) {
                buttons.push(
                    <MuteButton
                        key = 'mute'
                        participantID = { participantID }
                        mute = { _disableRemoteUnmute ? true : !isAudioMuted } />
                );
            }
            if (_participantCount > 2) {
                if (!_disableRemoteMute) {
                    buttons.push(
                        <MuteEveryoneElseButton
                            key = 'mute-others'
                            participantID = { participantID }
                            mute = { true } />
                    );
                }
                if (!_disableRemoteUnmute) {
                    buttons.push(
                        <MuteEveryoneElseButton
                            key = 'unmute-others'
                            participantID = { participantID }
                            mute = { false } />
                    );
                }
            }
            if (!_disableRemoteMuteVideo) {
                buttons.push(
                    <MuteVideoButton
                        key = 'mutevideo'
                        participantID = { participantID }
                        mute = { _disableRemoteUnmuteVideo ? true : !isVideoMuted } />
                );
            }
            if (_participantCount > 2) {
                if (!_disableRemoteMuteVideo) {
                    buttons.push(
                        <MuteVideoEveryoneElseButton
                            key = 'mutevideo-others'
                            participantID = { participantID }
                            mute = { true } />
                    );
                }
                if (!_disableRemoteUnmuteVideo) {
                    buttons.push(
                        <MuteVideoEveryoneElseButton
                            key = 'unmutevideo-others'
                            participantID = { participantID }
                            mute = { false } />
                    );
                }
            }

            if (!_disableGrantModerator) {
                buttons.push(
                    <GrantModeratorButton
                        key = 'grant-moderator'
                        participantID = { participantID } />
                );
            }

            // push a new button to show disable/enable chat option for selected remote participant
            buttons.push(
                <ChatDisableButton
                    key='disable-chat'
                    participantID = { participantID } />
            );

            // push a new button to show enable/disable chat option for all remote participants; doesn't affect moderators
            buttons.push(
                <AllChatDisableButton
                    key='disable-chat-all'
                    participantID = { participantID } />
            );

            if (!_disableKick) {
                buttons.push(
                    <KickButton
                        key = 'kick'
                        participantID = { participantID } />
                );
            }
        }

        if (remoteControlState) {
            buttons.push(
                <RemoteControlButton
                    key = 'remote-control'
                    onClick = { onRemoteControlToggle }
                    participantID = { participantID }
                    remoteControlState = { remoteControlState } />
            );
        }

        if (!_disablePrivateMessage) {
            buttons.push(
                <PrivateMessageMenuButton
                    key = 'privateMessage'
                    participantID = { participantID } />
            );
        }

        if (_shouldDisplayTileView) {
            if (!isFirst) {
                buttons.push(
                    <MoveToFirstButton
                        key = 'moveToFirst'
                        participantID = { participantID } />
                );
            }
            if (!isLast) {
                buttons.push(
                    <MoveToLastButton
                        key = 'moveToLast'
                        participantID = { participantID } />
                );
            }
        }

        if (onVolumeChange) {
            buttons.push(
                <VolumeSlider
                    initialValue = { initialVolumeValue }
                    key = 'volume-slider'
                    onChange = { onVolumeChange } />
            );
        }

        if (buttons.length > 0) {
            return (
                <RemoteVideoMenu id = { participantID }>
                    { buttons }
                </RemoteVideoMenu>
            );
        }

        return null;
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code RemoteVideoMenuTriggerButton}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {Object}
 */
function _mapStateToProps(state, ownProps) {
    const participant = getLocalParticipant(state);
    const {
        disableGrantModerator,
        disablePrivateMessage,
        disableRemoteMute,
        disableRemoteUnmute,
        disableRemoteMuteVideo,
        disableRemoteUnmuteVideo,
        remoteVideoMenu = {},
    } = state['features/base/config'];
    const { disableKick } = remoteVideoMenu;
    const { ordered } = state['features/video-layout'];
    const found = ordered?.indexOf(ownProps.participantID);

    return {
        _isModerator: Boolean(participant?.role === PARTICIPANT_ROLE.MODERATOR),
        _disableGrantModerator: Boolean(disableGrantModerator),
        _disableKick: Boolean(disableKick),
        _disablePrivateMessage: Boolean(disablePrivateMessage),
        _disableRemoteMute: Boolean(disableRemoteMute),
        _disableRemoteUnmute: Boolean(disableRemoteUnmute),
        _disableRemoteMuteVideo: Boolean(disableRemoteMuteVideo),
        _disableRemoteUnmuteVideo: Boolean(disableRemoteUnmuteVideo),
        _participantCount: getParticipantCount(state),
        _shouldDisplayTileView: shouldDisplayTileView(state),
        isFirst: ordered && found === 0,
        isLast: ordered && found === ordered.length - 1,
    };
}

export default connect(_mapStateToProps)(RemoteVideoMenuTriggerButton);
