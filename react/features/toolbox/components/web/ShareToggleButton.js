import { connect } from 'react-redux';

import { conferences } from '../../../../api/conferences';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents'
import { sendAnalytics } from '../../../analytics/functions';
import { setRoomInfo } from '../../../base/conference/actions';
import { translate } from '../../../base/i18n/functions';
import { IconScreenshare } from '../../../base/icons/svg';
import { isHost } from '../../../base/jwt/functions';
import { getLocalParticipant } from '../../../base/participants/functions';
import { getLocalVideoTrack } from '../../../base/tracks/functions';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { isForceMuted } from '../../../participants-pane/functions';
import { startScreenShareFlow } from '../../../screen-share/actions.web';
import { isScreenVideoShared } from '../../../screen-share/functions';
import { closeOverflowMenuIfOpen } from '../../../toolbox/actions.web';
import { toggleWhiteboard } from '../../../whiteboard/actions.any';


/**
 * Implementation of a button for toggling the share menu.
 */
class ShareToggleButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.shareMenu';
    toggledAccessibilityLabel = 'toolbar.stopSharing';
    icon = IconScreenshare;
    label = 'toolbar.shareMenu';
    toggledLabel = 'toolbar.stopSharing';

    /**
     * Retrieves tooltip dynamically.
     */
    get tooltip() {
        const { _screenSharing, _documentSharing } = this.props;

        if (_screenSharing || _documentSharing) {
            return 'toolbar.stopSharing';
        }

        return 'toolbar.shareMenu';
    }

    /**
     * Initializes a new {@code ShareMenuButton} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onToggleScreenshare = this._onToggleScreenshare.bind(this);
        this._onToggleWhiteboard = this._onToggleWhiteboard.bind(this);
    }

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick(e) {
        const {
            _approvedPresenter,
            _approvedWhiteboard,
            _documentSharing,
            _screenSharing,
            _shareMenuVisible,
        } = this.props;

        if (!_shareMenuVisible) {
            if (_documentSharing && _approvedWhiteboard) {
                this._onToggleWhiteboard();
                e.stopPropagation();
            } else if (_screenSharing && _approvedPresenter) {
                this._onToggleScreenshare();
                e.stopPropagation();
            }
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
     * Indicates whether a key was pressed.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _onKeyDown() {
        this.props.onKeyDown();
    }

    _onToggleScreenshare() {
        const {
            _screenSharing,
            dispatch
        } = this.props;

        sendAnalytics(createToolbarEvent(
            'toggle.screen.sharing',
            { enable: !_screenSharing }));

        dispatch(closeOverflowMenuIfOpen());
        dispatch(startScreenShareFlow(!_screenSharing));
    }

    _onToggleWhiteboard() {
        const { _documentSharing, _roomInfo, _local, dispatch } = this.props;

        dispatch(closeOverflowMenuIfOpen());

        sendAnalytics(createToolbarEvent(
            'toggle.whiteboard.sharing',
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

export default connect(mapStateToProps)(translate(ShareToggleButton));
