// @flow

import InlineDialog from '@atlaskit/inline-dialog';
import axios from 'axios';
import { find, once } from 'lodash';
import React from 'react';

import { getAuthUrl } from '../../../api/url';
import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { appNavigate } from '../../app/actions';
import { Avatar } from '../../base/avatar';
import { disconnect } from '../../base/connection';
import { translate } from '../../base/i18n';
import { Icon, IconCheck, IconOpenInNew, IconPresentation } from '../../base/icons';
import {
    grantModerator,
    getLocalParticipant,
    PARTICIPANT_ROLE
 } from '../../base/participants';
import { connect } from '../../base/redux';
import { AbstractHangupButton, HangupMenuItem } from '../../base/toolbox/components';
import type { AbstractButtonProps } from '../../base/toolbox/components';

import s from './HangupButton.module.scss';
import { isHost } from '../../base/jwt';

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
            selected: find(props._participants, { local: false })?.id,
        };
        console.log('HangupButton:', props._participants);

        this._hangup = once(() => {
            sendAnalytics(createToolbarEvent('hangup'));

            // FIXME: these should be unified.
            if (navigator.product === 'ReactNative') {
                this.props.dispatch(appNavigate(undefined));
            } else {
                this.props.dispatch(disconnect(true));
            }
        });
        this._onCloseDialog = this._onCloseDialog.bind(this);
        this._onHangupAll = this._onHangupAll.bind(this);
        this._onHangupMe = this._onHangupMe.bind(this);
        this._onModeratorSelection = this._onModeratorSelection.bind(this);
        this._onSubmitModeratorSelection = this._onSubmitModeratorSelection.bind(this);
    }
    
    /**
     * Helper function to perform the actual hangup action.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _doHangup() {
        const { _showHangupMenu, _timer } = this.props;
        if (_showHangupMenu) {
            this.setState({ isOpen: true });
            _timer?.pause();
        } else {
            this._hangup();
        }
    }

    _renderHangupOptionsMenuContent() {
        const { t } = this.props;

        if (this.state.showSelectModerator) {
            return this._renderModeratorSelectionContent();
        }

        return [
            <HangupMenuItem
                accessibilityLabel = { t('toolbar.accessibilityLabel.hangupAll') }
                icon = { IconPresentation }
                key = 'hangupAll'
                className = { s.menuItemWarning }
                onClick = { this._onHangupAll }
                text = { t('toolbar.hangupAll') } />,
            <HangupMenuItem
                accessibilityLabel = { t('toolbar.accessibilityLabel.hangup') }
                icon = { IconOpenInNew }
                key = 'hangup'
                className = { s.menuItem }
                onClick = { this._onHangupMe }
                text = { t('toolbar.hangup') } />
        ];
    }

    _renderModeratorSelectionItem(props) {
        const { accessibilityLabel, disabled, elementAfter, id, key, text, selected } = props;

        let className = selected ? s.menuItemSelected : s.menuItem;
        className += disabled ? ' disabled' : '';

        return (
            <li
                aria-label = { accessibilityLabel }
                className = { className }
                onClick = { disabled ? null : () => this._onModeratorSelection(id) }
                key = { key } >
                <div className = { s.avatar }>
                    <Avatar participantId = { id } size = { 24 } />
                </div>
                <div className = { s.text }>{ text }</div>
                <div className = { s.icon }>
                { selected && <Icon src = { IconCheck } /> }
                </div>
                { elementAfter || null }
            </li>
        );
    }

    _renderModeratorSelectionContent() {
        const { _participants, t } = this.props;
        const selected = this.state.selected || this.props._selected;

        if (_participants.length <= 1)
            return [];

        return [
            <ul className={s.particpantList}>
                { _participants.map((item, i) => this._renderModeratorSelectionItem({
                    key: item.id,
                    accessibilityLabel: t('toolbar.accessibilityLabel.moderatorSelectionList'),
                    text: item.name,
                    selected: item.id === selected,
                    ...item
                })) }
            </ul>,
            <hr className = {s.hangupMenuHr} key = 'hr' />,
            <li
                aria-label = { t('toolbar.accessibilityLabel.grantModerator') }
                className = { s.menuItemWarning }
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
        const { _moderator, _participants } = this.props;

        if (_moderator || _participants.length === 1) {
            if (!_moderator) {
                this.props.dispatch(grantModerator(_participants[0].id));
            }
            this._hangup();
        } else {
            this.setState({ showSelectModerator: true });
        }
    }

    _onHangupAll: () => void;

    async _onHangupAll() {
        const { _apiBase, _roomInfo, _meetingId } = this.props;
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
        const { isOpen, showSelectModerator } = this.state;
        const children = (
            <ul
                className = { showSelectModerator ? s.moderatorSelectionMenu : s.hangupMenu }>
                { this._renderHangupOptionsMenuContent() }
            </ul>
        );

        return (
            <div className = { s.hangupButton }>
                <InlineDialog
                    content = { children }
                    isOpen = { isOpen }
                    onClose = { this._onCloseDialog }
                    placement = { 'top' }>
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
            const inHangupMenu = e.event.target.closest(`.${s.hangupButton}`);
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
    const participants = state['features/base/participants'];
    const { conference, roomInfo } = state['features/base/conference'];
    const isModerator = getLocalParticipant(state).role === PARTICIPANT_ROLE.MODERATOR;

    let moderator = 0;
    const items = participants.filter(p => {
        if (!p.local && !p.isFakeParticipant) {
            if (!moderator && p.role === PARTICIPANT_ROLE.MODERATOR) {
                moderator = p.id;
            }
            return true;
        }
        return false;
    });

    return {
        _apiBase: getAuthUrl(state),
        _moderator: moderator,
        _meetingId: conference?.room?.meetingId,
        _participants: items,
        _selected: !moderator && items[0]?.id,
        _showHangupMenu: isModerator && participants.length > 1,
        _roomInfo: roomInfo,
        _timer: state['features/toolbox'].timer,
    };
}

export default translate(connect(_mapStateToProps)(HangupButton));
