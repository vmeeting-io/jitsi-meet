// @flow

import InlineDialog from '@atlaskit/inline-dialog';
import axios from 'axios';
import { each, once } from 'lodash';
import React from 'react';

import { getAuthUrl } from '../../../../api/url';
import { createBreakoutRoomsEvent, createToolbarEvent, sendAnalytics } from '../../../analytics';
import { appNavigate } from '../../../app/actions';
import { disconnect } from '../../../base/connection';
import { translate } from '../../../base/i18n';
import { browser } from '../../../base/lib-jitsi-meet';
import {
    grantModerator,
    isLocalParticipantModerator
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractHangupButton, HangupMenuItem } from '../../../base/toolbox/components';
import type { AbstractButtonProps } from '../../../base/toolbox/components';
import {
    getBreakoutRooms,
    getParticipantCountInBreakoutRooms,
    isInBreakoutRoom,
    moveToRoom,
    removeBreakoutRoom
} from '../../../breakout-rooms';

import ParticipantItem from './ParticipantItem';

/**
 * The type of the React {@code Component} props of {@link HangupButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * Component that renders a toolbar button for leaving the current conference.
 *
 * @extends AbstractHangupButton
 */
class HangupButton extends AbstractHangupButton<Props, *> {
    _hangup: Function;

    accessibilityLabel = 'toolbar.accessibilityLabel.hangup';
    label = 'toolbar.hangup';
    tooltip = 'toolbar.hangup';

    /**
     * Initializes a new HangupButton instance.
     *
     * @param {Props} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            isOpen: false,
            selected: props._participants[0],
        };
        console.log('HangupButton:', props._participants);

        this._hangup = once(() => {
            sendAnalytics(createToolbarEvent('hangup'));

            this.setState({ isOpen: false, busy: true });
            // FIXME: these should be unified.
            if (browser.isReactNative()) {
                this.props.dispatch(appNavigate(undefined));
            } else {
                this.props.dispatch(disconnect(true));
            }
        }).bind(this);
        this._onCloseDialog = this._onCloseDialog.bind(this);
        this._doHangup = this._doHangup.bind(this);
        this._onHangupAll = this._onHangupAll.bind(this);
        this._onHangupMe = this._onHangupMe.bind(this);
        this._onLeaveBreakoutRoom = this._onLeaveBreakoutRoom.bind(this);
        this._onModeratorSelection = this._onModeratorSelection.bind(this);
        this._onSubmitModeratorSelection = this._onSubmitModeratorSelection.bind(this);
    }
    
    _doHangup: () => void;

    /**
     * Helper function to perform the actual hangup action.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _doHangup() {
        if (this.state.busy) {
            return;
        }

        const { _showHangupMenu, _timer } = this.props;
        if (_showHangupMenu) {
            this.setState({ isOpen: true });
            _timer?.pause();
        } else {
            this._hangup();
        }
    }

    _renderHangupOptionsMenuContent() {
        const { _isInBreakoutRoom, _participants, t } = this.props;
        const menus = [];

        if (_isInBreakoutRoom) {
            menus.push(
                <HangupMenuItem
                    accessibilityLabel = { t('breakoutRooms.actions.leaveBreakoutRoom')}
                    key = 'leave-breakout-room'
                    className = 'menu-item-warning'
                    onClick = { this._onLeaveBreakoutRoom }
                    text = { t('breakoutRooms.actions.leaveBreakoutRoom') } />,
            );
            menus.push(
                <HangupMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.hangup') }
                    key = 'hangup'
                    className = 'menu-item'
                    onClick = { this._hangup }
                    text = { t('toolbar.hangup') } />
            )
            return menus;
        }

        if (this.state.showSelectModerator) {
            return this._renderModeratorSelectionContent();
        }

        menus.push(
            <HangupMenuItem
                accessibilityLabel = { t('toolbar.accessibilityLabel.hangupAll') }
                key = 'hangupAll'
                className = 'menu-item-warning'
                onClick = { this._onHangupAll }
                text = { t('toolbar.hangupAll') } />
        );

        if (_participants.length > 0) {
            menus.push(<HangupMenuItem
                accessibilityLabel = { t('toolbar.accessibilityLabel.hangup') }
                key = 'hangup'
                className = 'menu-item'
                onClick = { this._onHangupMe }
                text = { t('toolbar.hangup') } />
            );
        }

        return menus;
    }

    _renderModeratorSelectionContent() {
        const { _participants, _participantCount, t } = this.props;

        if (_participantCount <= 1)
            return [];

        const selected = this.state.selected || this.props._selected;
        return [
            <ul className = 'participant-list' key = 'remotes'>
                { _participants.map(id => (
                    <ParticipantItem
                        key = { id }
                        participantID = { id }
                        selected = { id === selected }
                        onClick = { () => this._onModeratorSelection(id) } />
                )) }
            </ul>,
            <hr className = 'hangup-menu-hr' key = 'hr' />,
            <li
                aria-label = { t('toolbar.accessibilityLabel.grantModerator') }
                className = 'menu-item-warning'
                onClick =  { this._onSubmitModeratorSelection }
                key = 'close'>
                <div className = 'text'>
                    { t('toolbar.selectModeratorAndLeave') }
                </div>
            </li>
        ];
    }

    _onHangupMe: () => void;

    _onHangupMe(e) {
        const { _participants, _moderators } = this.props;

        if (_participants.length === 1 || _moderators > 1) {
            if (_moderators === 1) {
                this.props.dispatch(grantModerator(_participants[0]));
            }
            this._hangup();
        } else {
            this.setState({ showSelectModerator: true });
        }
    }

    _onHangupAll: () => void;

    async _onHangupAll() {
        const { _apiBase, _roomInfo, _rooms, _meetingId, dispatch } = this.props;

        this.setState({ isOpen: false });

        // destroy breakout rooms
        each(_rooms, room => {
            if (!room.isMainRoom) {
                dispatch(removeBreakoutRoom(room.jid));
            }
        });

        if (_roomInfo) {
            const apiUrl = `${_apiBase}/conferences/${_roomInfo._id}`;
            axios.delete(apiUrl);
            this._hangup();
        } else if (_meetingId) {
            try {
                const resp = await axios.get(`${_apiBase}/conferences?meeting_id=${_meetingId}`);
                const conf = resp.data?.docs[0];
                console.log(resp, conf);
                axios.delete(`${_apiBase}/conferences/${conf._id}`);
                this._hangup();
            } catch (err) {
                console.error('_onHangupAll: failed!', err);
            }
        }
    }

    _onLeaveBreakoutRoom: () => void;

    _onLeaveBreakoutRoom() {
        sendAnalytics(createBreakoutRoomsEvent('leave'));
        this.props.dispatch(moveToRoom());
        this.setState({ isOpen: false });
    }

    _onModeratorSelection: () => void;

    _onModeratorSelection(id) {
        this.setState({ selected: id });
    }

    _onSubmitModeratorSelection: () => void;

    _onSubmitModeratorSelection() {
        const selected = this.state.selected || this.props._selected;
        this.props.dispatch(grantModerator(selected));
        this._hangup();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (!this.props.visible) {
            return null;
        }

        const { isOpen, showSelectModerator } = this.state;
        const children = (
            <ul
                className = { showSelectModerator ? 'moderator-selection-menu' : 'hangup-menu' }>
                { this._renderHangupOptionsMenuContent() }
            </ul>
        );

        return (
            <div className = 'toolbox-button'>
                <InlineDialog
                    content = { children }
                    isOpen = { isOpen }
                    onClose = { this._onCloseDialog }
                    placement = { 'top-end' }>
                    { super.render() }
                </InlineDialog>
            </div>
        );
    }

    _onCloseDialog: () => void;

    /**
     * Callback invoked when {@code InlineDialog} signals that it should be
     * close.
     *
     * @private
     * @returns {void}
     */
    _onCloseDialog(e) {
        if (this.state.showSelectModerator) {
            const inHangupMenu = e.event.target.closest('.hangup-button');
            const isGhost = !Boolean(e.event.target.closest('body'));
            if (isGhost || inHangupMenu) return;
        }

        this.setState({
            isOpen: false,
            showSelectModerator: false,
        });
        this.props._timer?.resume();
    }
}

/**
 * Maps (parts of) the redux state to {@link HangupButton}'s React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {{}}
 */
 function _mapStateToProps(state) {
    const { remoteParticipants } = state['features/filmstrip'];
    const { conference, roomInfo } = state['features/base/conference'];
    const isModerator = isLocalParticipantModerator(state);
    const _isInBreakoutRoom = isInBreakoutRoom(state);
    const participantCount = getParticipantCountInBreakoutRooms(state);

    return {
        _apiBase: getAuthUrl(state),
        _isInBreakoutRoom,
        _meetingId: conference?.room?.meetingId,
        _participants: remoteParticipants,
        _rooms: getBreakoutRooms(state),
        _selected: remoteParticipants[0],
        _showHangupMenu: _isInBreakoutRoom || (isModerator && participantCount > 1),
        _moderators: state['features/base/participants'].moderators.size,
        _roomInfo: roomInfo,
        _timer: state['features/toolbox'].timer,
    };
}

export default translate(connect(_mapStateToProps)(HangupButton));
