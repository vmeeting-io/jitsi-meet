// @flow

import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconVolumeOff, IconVolumeUp } from '../../../base/icons/svg';
import JitsiMeetJS from '../../../base/lib-jitsi-meet';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { setOverflowMenuVisible } from '../../../toolbox/actions';
import ShareDocumentWarningDialog from '../../../whiteboard/components/ShareDocumentWarningDialog';
import { startAudioScreenShareFlow } from '../../actions.web';
import { isAudioOnlySharing, isScreenAudioSupported } from '../../functions';

/**
 * Component that renders a toolbar button for toggling audio only screen share.
 */
class ShareAudioButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.shareaudio';
    icon = IconVolumeUp;
    label = 'toolbar.shareaudio';
    tooltip = 'toolbar.shareaudio';
    toggledIcon = IconVolumeOff;
    toggledLabel = 'toolbar.stopAudioSharing';

    /**
     * Handles clicking / pressing the button, and opens a new dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { _documentSharing, dispatch } = this.props;

        if (_documentSharing) {
            dispatch(openDialog(ShareDocumentWarningDialog));
            return;
        }

        dispatch(startAudioScreenShareFlow());
        dispatch(setOverflowMenuVisible(false));
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isAudioOnlySharing;
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state: Object): $Shape<Props> {
    const { editing } = state['features/whiteboard'];

    return {
        _documentSharing: Boolean(editing),
        _isAudioOnlySharing: Boolean(isAudioOnlySharing(state)),
        visible: JitsiMeetJS.isDesktopSharingEnabled() && isScreenAudioSupported()
    };
}

export default translate(connect(_mapStateToProps)(ShareAudioButton));
