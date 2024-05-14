import { connect } from 'react-redux';

import { conferences } from '../../../../api/conferences';
import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { setRoomInfo } from '../../../base/conference/actions';
import { translate } from '../../../base/i18n/functions';
import { IconWhiteboard, IconWhiteboardHide } from '../../../base/icons/svg';
import { getLocalParticipant } from '../../../base/participants/functions';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { closeOverflowMenuIfOpen } from '../../../toolbox/actions.web';

import { toggleWhiteboard } from '../../actions.any';
import { isWhiteboardAllowed, isWhiteboardButtonVisible, isWhiteboardVisible } from '../../functions';

/**
 * Component that renders a toolbar button for the whiteboard.
 */
class WhiteboardButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.showWhiteboard';
    toggledAccessibilityLabel = 'toolbar.accessibilityLabel.hideWhiteboard';
    icon = IconWhiteboard;
    label = 'toolbar.showWhiteboard';
    toggledIcon = IconWhiteboardHide;
    toggledLabel = 'toolbar.hideWhiteboard';
    toggledTooltip = 'toolbar.hideWhiteboard';
    tooltip = 'toolbar.showWhiteboard';

    /**
     * Retrieves tooltip dynamically.
     *
     * @returns {string}
     */
    _getTooltip() {
        const { _desktopSharingEnabled, _documentSharing } = this.props;

        if (_desktopSharingEnabled) {
            if (_documentSharing) {
                return 'toolbar.stopScreenSharing';
            }

            return 'toolbar.startScreenSharing';
        }

        return 'dialog.shareYourScreenDisabled';
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._documentSharing;
    }

    /**
     * Indicates whether this button is in disabled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return !this.props._documentSharingEnabled;
    }

    /**
     * Handles clicking / pressing the button, and opens / closes the whiteboard view.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
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
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state) {
    const local = getLocalParticipant(state);
    const { roomInfo } = state['features/base/conference'];

    return {
        _documentSharing: isWhiteboardVisible(state),
        _documentSharingEnabled: isWhiteboardAllowed(state),
        _local: local,
        _roomInfo: roomInfo,
        visible: isWhiteboardButtonVisible(state)
    };
}

export default translate(connect(_mapStateToProps)(WhiteboardButton));
