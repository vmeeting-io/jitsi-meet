// @flow

import InlineDialog from '@atlaskit/inline-dialog';
import React, { Fragment } from 'react';

import {
    ACTION_SHORTCUT_TRIGGERED,
    createToolbarEvent,
    sendAnalytics
} from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconShareDesktop } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { isHost } from '../../../base/jwt';
import { getLocalVideoTrack } from '../../../base/tracks';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import {
    isScreenVideoShared,
    startScreenShareFlow
} from '../../../screen-share';
import { toggleBackgroundEffect } from '../../../virtual-background';
import { VIRTUAL_BACKGROUND_TYPE } from '../../../virtual-background/constants';
import { WhiteboardButton } from '../../../whiteboard/components';
import {
    setShareMenuVisible,
    setToolbarHovered,
} from '../../actions';

import ShareDesktopButton from './ShareDesktopButton';
import { toggleWhiteboard } from '../../../whiteboard';
import { isForceMuted } from '../../../participants-pane/functions';
import { getLocalParticipant } from '../../../base/participants';
import { setRoomInfo } from '../../../base/conference';
import { conferences } from '../../../../api/conferences';

/**
 * Share Desktop Popup.
 *
 * @returns {ReactElement}
 */
class ShareMenuButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.shareMenu';
    label = 'toolbar.shareMenu';
    icon = IconShareDesktop;
    toggledLabel = 'toolbar.stopSharing';
    tooltip = 'toolbar.accessibilityLabel.shareMenu';

    /**
     * Initializes a new {@code ShareMenuButton} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._hideMenu = this._hideMenu.bind(this);
        this._onToggleScreenshare = this._onToggleScreenshare.bind(this);
        this._onToggleWhiteboard = this._onToggleWhiteboard.bind(this);
        this._onEscKey = this._onEscKey.bind(this);
        this._onClose = this._onClose.bind(this);
    }

    _hideMenu() {
        this.props.dispatch(setShareMenuVisible(false));
    }

    _onEscKey: (KeyboardEvent) => void;

    /**
     * Key handler for overflow menu.
     *
     * @param {KeyboardEvent} e - Esc key click to close the popup.
     * @returns {void}
     */
    _onEscKey(e) {
        if (e.key === 'Escape') {
            e.stopPropagation();
            this._hideMenu();
        }
    }

    _onToggleScreenshare() {
        sendAnalytics(createToolbarEvent(
            'toggle.screen.sharing',
            ACTION_SHORTCUT_TRIGGERED,
            { enable: !this.props._screenSharing }));

        const {
            _backgroundType,
            _desktopSharingEnabled,
            _localVideo,
            _virtualSource,
            dispatch
        } = this.props;

        if (_backgroundType === VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE) {
            const noneOptions = {
                enabled: false,
                backgroundType: VIRTUAL_BACKGROUND_TYPE.NONE,
                selectedThumbnail: VIRTUAL_BACKGROUND_TYPE.NONE,
                backgroundEffectEnabled: false
            };

            _virtualSource.dispose();

            dispatch(toggleBackgroundEffect(noneOptions, _localVideo));

            return;
        }

        if (_desktopSharingEnabled) {
            dispatch(startScreenShareFlow());
        }
    }

    _onToggleWhiteboard() {
        const { _documentSharing, _roomInfo, _local, dispatch } = this.props;

        sendAnalytics(createToolbarEvent(
            'toggle.whiteboard.sharing',
            ACTION_SHORTCUT_TRIGGERED,
            { enable: !_documentSharing }));

        conferences()
            .id(_roomInfo._id)
            .update({ whiteboard: {
                ...(_roomInfo.whiteboard || {}),
                owner: _documentSharing ? '' : _local.id,
            }})
            .then(resp => {
                console.log('conference updated:', resp.data);
                dispatch(setRoomInfo(resp.data));
            })
            .catch(err => {
                console.error('update error: toggle whiteboard is failed.', err);
            });

        dispatch(toggleWhiteboard());
    }

    _getMenus() {
        const menus = [{
            afterClick: this._hideMenu,
            key: 'desktop',
            Content: ShareDesktopButton,
            handleClick: this._onToggleScreenshare,
        }, {
            afterClick: this._hideMenu,
            key: 'whiteboard',
            Content: WhiteboardButton,
            handleClick: this._onToggleWhiteboard,
        }];

        return (
            <ul
                className = 'share-menu'
                id = 'share-menu'
                onKeyDown = { this._onEscKey }
                role = 'menu'>
                {menus.map(({ key, Content, ...rest }) => (
                    <Fragment key = { `f${key}` }>
                        <Content { ...rest } key = { key } showLabel = { true } />
                    </Fragment>
                ))}
            </ul>
        );
    }

    /**
     * Retrieves tooltip dynamically.
     */
    get tooltip() {
        const { _screenSharing, _documentSharing } = this.props;

        if (_screenSharing || _documentSharing) {
            return 'toolbar.stopSharing';
        }

        return 'toolbar.sharePopup';
    }

    /**
     * Required by linter due to AbstractButton overwritten prop being writable.
     *
     * @param {string} _value - The icon value.
     */
    set tooltip(_value) {
        // Unused.
    }

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const {
            _approvedPresenter,
            _approvedWhiteboard,
            _documentSharing,
            _screenSharing,
            _shareMenuVisible,
            dispatch
        } = this.props;

        if (_shareMenuVisible) {
            dispatch(setShareMenuVisible(false));
            dispatch(setToolbarHovered(false));
        } else {
            if (_screenSharing && _approvedPresenter) {
                this._onToggleScreenshare();
                return;
            } else if (_documentSharing && _approvedWhiteboard) {
                this._onToggleWhiteboard();
                return;
            }
    
            dispatch(setToolbarHovered(true));
            dispatch(setShareMenuVisible(true));
        }
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._screenSharing || this.props._documentSharing;
    }

    /**
     * Indicates whether this button is in disabled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        const {
            _approvedPresenter,
            _approvedWhiteboard,
            _documentSharing,
            _screenSharing,
        } = this.props;

        if (!_documentSharing && !_screenSharing) {
            return false;
        }

        return (_screenSharing && !_approvedPresenter) ||
            (_documentSharing && !_approvedWhiteboard);
    }

    /**
     * Returns true if the desktop sharing button should be visible and
     * false otherwise.
     *
     * @returns {boolean}
     */
    _showDesktopSharingButton() {
        const {
            _desktopSharingEnabled,
            _desktopSharingDisabledTooltipKey
        } = this.props;

        return _desktopSharingEnabled || _desktopSharingDisabledTooltipKey;
    }

    _onClose: () => void;

    /**
     * Callback invoked when {@code InlineDialog} signals that it should be
     * close.
     *
     * @private
     * @returns {void}
     */
    _onClose() {
        this.props.dispatch(setShareMenuVisible(false));
    }

    render() {
        const { _shareMenuVisible } = this.props;

        return (
            <div className = 'share-menu-popup'>
                <InlineDialog
                    content = { this._getMenus() }
                    isOpen = { _shareMenuVisible }
                    onClose = { this._onClose }
                    placement = 'top-start'>
                    {super.render()}
                </InlineDialog>
            </div>
        );
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    let desktopSharingEnabled = JitsiMeetJS.isDesktopSharingEnabled();
    const {
        disableDesktopSharing,
        enableFeaturesBasedOnToken,
    } = state['features/base/config'];
    const { shareMenuVisible } = state['features/toolbox'];
    const localVideo = getLocalVideoTrack(state['features/base/tracks']);
    const isGuest = !isHost(state);
    const local = getLocalParticipant(state);
    const { roomInfo } = state['features/base/conference'];
    const _approvedPresenter = !isForceMuted(local, 'presenter', state);
    const _approvedWhiteboard = !isForceMuted(local, 'whiteboard', state);

    let desktopSharingDisabledTooltipKey;

    if (enableFeaturesBasedOnToken) {
        if (desktopSharingEnabled) {
            // we enable desktop sharing if any participant already have this
            // feature enabled and if the user supports it.
            desktopSharingEnabled = haveParticipantWithScreenSharingFeature(state);
            desktopSharingDisabledTooltipKey = 'dialog.shareYourScreenDisabled';
        }
    } else if (desktopSharingEnabled && Boolean(disableDesktopSharing)) {
        desktopSharingEnabled = !(
            disableDesktopSharing === true ||
            (disableDesktopSharing === 'guest' && isGuest)
        );
    }

    const _screenSharing = isScreenVideoShared(state);
    const { editing } = state['features/whiteboard'];

    return {
        _approvedPresenter,
        _approvedWhiteboard,
        _desktopSharingEnabled: desktopSharingEnabled,
        _desktopSharingDisabledTooltipKey: desktopSharingDisabledTooltipKey,
        _documentSharing: Boolean(editing),
        _isOpen: false,
        _local: local,
        _localVideo: localVideo,
        _roomInfo: roomInfo,
        _screenSharing,
        _shareMenuVisible: shareMenuVisible,
        _virtualSource: state['features/virtual-background'].virtualSource,
    };
}

export default translate(connect(mapStateToProps)(ShareMenuButton));
