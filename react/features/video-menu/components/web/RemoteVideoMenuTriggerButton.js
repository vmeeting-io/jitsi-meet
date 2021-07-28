// @flow

import React, { Component } from 'react';

import { translate } from '../../../base/i18n';
import { Icon, IconMenuThumb } from '../../../base/icons';
import { getLocalParticipant, getParticipantById, isParticipantModerator, PARTICIPANT_ROLE } from '../../../base/participants';
import { Popover } from '../../../base/popover';
import { connect } from '../../../base/redux';
import { requestRemoteControl, stopController } from '../../../remote-control';
import { getCurrentLayout, LAYOUTS, shouldDisplayTileView } from '../../../video-layout';

import MuteEveryoneElseButton from './MuteEveryoneElseButton';
import MuteEveryoneElsesVideoButton from './MuteEveryoneElsesVideoButton';
import { REMOTE_CONTROL_MENU_STATES } from './RemoteControlButton';

import {
    RevokeModeratorButton,
    GrantModeratorButton,
    MuteButton,
    MuteVideoButton,
    KickButton,
    PrivateMessageMenuButton,
    RemoteControlButton,
    VideoMenu,
    VolumeSlider
} from './';
import MoveToFirstButton from './MoveToFirstButton';
import MoveToLastButton from './MoveToLastButton';

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
     * Whether or not to display the grant moderator button.
     */
    _disableGrantModerator: Boolean,

    /**
     * Whether or not the participant is a conference moderator.
     */
    _isModerator: boolean,

    /**
     * The position relative to the trigger the remote menu should display
     * from. Valid values are those supported by AtlasKit
     * {@code InlineDialog}.
     */
    _menuPosition: string,

    /**
     * Whether to display the Popover as a drawer.
     */
    _overflowDrawer: boolean,

    /**
     * The current state of the participant's remote control session.
     */
    _remoteControlState: number,


    /**
     * The redux dispatch function.
     */
    dispatch: Function,

    /**
     * A value between 0 and 1 indicating the volume of the participant's
     * audio element.
     */
    initialVolumeValue: ?number,

    /**
     * Callback to invoke when changing the level of the participant's
     * audio element.
     */
    onVolumeChange: Function,

    /**
     * The ID for the participant on which the remote video menu will act.
     */
    participantID: string,

    /**
     * The ID for the participant on which the remote video menu will act.
     */
    _participantDisplayName: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * React {@code Component} for displaying an icon associated with opening the
 * the {@code VideoMenu}.
 *
 * @extends {Component}
 */
class RemoteVideoMenuTriggerButton extends Component<Props> {
    constructor(props) {
        super(props);

        this._onMenuOpen = this._onMenuOpen.bind(this);
        this._closeMenu = this._closeMenu.bind(this);
    }

    _onMenuOpen(doMenuClose) {
        this.setState({ doMenuClose });
    }

    _closeMenu() {
        this.state.doMenuClose && this.state.doMenuClose();
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

        const username = this.props._participantDisplayName;

        return (
            <Popover
                content = { content }
                overflowDrawer = { this.props._overflowDrawer }
                onPopoverOpen = { this._onMenuOpen }
                position = { this.props._menuPosition }>
                <span className = 'popover-trigger remote-video-menu-trigger'>
                    <Icon
                        ariaLabel = { this.props.t('dialog.remoteUserControls', { username }) }
                        role = 'button'
                        size = '1.4em'
                        src = { IconMenuThumb }
                        tabIndex = { 0 }
                        title = { this.props.t('dialog.remoteUserControls', { username }) } />
                </span>
            </Popover>
        );
    }

    /**
     * Creates a new {@code VideoMenu} with buttons for interacting with
     * the remote participant.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderRemoteVideoMenu() {
        const {
            _disableKick,
            _disableRemoteMute,
            _disableGrantModerator,
            _isModerator,
            _remoteControlState,
            _shouldDisplayTileView,
            dispatch,
            initialVolumeValue,
            isFirst,
            isLast,
            onVolumeChange,
            participantID,
            _participant
        } = this.props;

        const buttons = [];
        const isRemoteParticipantModerator = isParticipantModerator(_participant);

        if (_isModerator) {
            if (!_disableRemoteMute) {
                buttons.push(
                    <MuteButton
                        key = 'mute'
                        participantID = { participantID } />
                );
                buttons.push(
                    <MuteEveryoneElseButton
                        key = 'mute-others'
                        participantID = { participantID } />
                );
                buttons.push(
                    <MuteVideoButton
                        key = 'mute-video'
                        participantID = { participantID } />
                );
                buttons.push(
                    <MuteEveryoneElsesVideoButton
                        key = 'mute-others-video'
                        participantID = { participantID } />
                );
            }

            if (!_disableGrantModerator) {
                buttons.push(
                    <GrantModeratorButton
                        key = 'grant-moderator'
                        participantID = { participantID } />
                );
            }

            if (isRemoteParticipantModerator) {
                buttons.push(
                    <RevokeModeratorButton
                        key = 'revoke-moderator'
                        participantID = { participantID } />
                );
            }

            if (!_disableKick) {
                buttons.push(
                    <KickButton
                        key = 'kick'
                        participantID = { participantID } />
                );
            }
        }

        if (_remoteControlState) {
            let onRemoteControlToggle = null;

            if (_remoteControlState === REMOTE_CONTROL_MENU_STATES.STARTED) {
                onRemoteControlToggle = () => dispatch(stopController(true));
            } else if (_remoteControlState === REMOTE_CONTROL_MENU_STATES.NOT_STARTED) {
                onRemoteControlToggle = () => dispatch(requestRemoteControl(participantID));
            }

            buttons.push(
                <RemoteControlButton
                    key = 'remote-control'
                    onClick = { onRemoteControlToggle }
                    participantID = { participantID }
                    remoteControlState = { _remoteControlState } />
            );
        }

        buttons.push(
            <PrivateMessageMenuButton
                key = 'privateMessage'
                participantID = { participantID } />
        );

        if (_shouldDisplayTileView) {
            if (!isFirst) {
                buttons.push(
                    <MoveToFirstButton
                        key = 'moveToFirst'
                        onClick = { this._closeMenu }
                        participantID = { participantID } />
                );
            }
            if (!isLast) {
                buttons.push(
                    <MoveToLastButton
                        key = 'moveToLast'
                        onClick = { this._closeMenu }
                        participantID = { participantID } />
                );
            }
        }

        if (onVolumeChange && typeof initialVolumeValue === 'number' && !isNaN(initialVolumeValue)) {
            buttons.push(
                <VolumeSlider
                    initialValue = { initialVolumeValue }
                    key = 'volume-slider'
                    onChange = { onVolumeChange } />
            );
        }

        if (buttons.length > 0) {
            return (
                <VideoMenu id = { participantID }>
                    { buttons }
                </VideoMenu>
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
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps) {
    const { participantID } = ownProps;
    const localParticipant = getLocalParticipant(state);
    const { remoteVideoMenu = {}, disableRemoteMute } = state['features/base/config'];
    const { disableKick, disableGrantModerator } = remoteVideoMenu;
    let _remoteControlState = null;
    const participant = getParticipantById(state, participantID);
    const _participantDisplayName = participant.name;
    const _isRemoteControlSessionActive = participant?.remoteControlSessionStatus ?? false;
    const _supportsRemoteControl = participant?.supportsRemoteControl ?? false;
    const { active, controller } = state['features/remote-control'];
    const { requestedParticipant, controlled } = controller;
    const activeParticipant = requestedParticipant || controlled;
    const { overflowDrawer } = state['features/toolbox'];
    const participants = state['features/base/participants'];

    if (_supportsRemoteControl
            && ((!active && !_isRemoteControlSessionActive) || activeParticipant === participantID)) {
        if (requestedParticipant === participantID) {
            _remoteControlState = REMOTE_CONTROL_MENU_STATES.REQUESTING;
        } else if (controlled) {
            _remoteControlState = REMOTE_CONTROL_MENU_STATES.STARTED;
        } else {
            _remoteControlState = REMOTE_CONTROL_MENU_STATES.NOT_STARTED;
        }
    }

    const currentLayout = getCurrentLayout(state);
    let _menuPosition;

    switch (currentLayout) {
    case LAYOUTS.TILE_VIEW:
        _menuPosition = 'left-start';
        break;
    case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
        _menuPosition = 'left-end';
        break;
    default:
        _menuPosition = 'auto';
    }

    return {
        _isModerator: Boolean(localParticipant?.role === PARTICIPANT_ROLE.MODERATOR),
        _disableKick: Boolean(disableKick),
        _disableRemoteMute: Boolean(disableRemoteMute),
        _remoteControlState,
        _menuPosition,
        _overflowDrawer: overflowDrawer,
        _participant: participant,
        _participantDisplayName,
        _disableGrantModerator: Boolean(disableGrantModerator),
        _shouldDisplayTileView: shouldDisplayTileView(state),
        isFirst: participants[0] === participant,
        isLast: participants[participants.length - 1] === participant,
    };
}

export default translate(connect(_mapStateToProps)(RemoteVideoMenuTriggerButton));
