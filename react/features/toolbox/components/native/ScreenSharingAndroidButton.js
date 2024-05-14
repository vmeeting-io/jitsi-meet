// @flow
import { connect } from 'react-redux';

import { ANDROID_SCREENSHARING_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconScreenshare } from '../../../base/icons/svg';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { toggleScreensharing } from '../../../base/tracks/actions';
import { isLocalVideoTrackDesktop } from '../../../base/tracks/functions';

/**
 * An implementation of a button for toggling screen sharing.
 */
class ScreenSharingAndroidButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.shareYourScreen';
    icon = IconScreenshare;
    label = 'toolbar.startScreenSharing';
    toggledLabel = 'toolbar.stopScreenSharing';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const enable = !this._isToggled();

        this.props.dispatch(toggleScreensharing(enable));
    }

    /**
     * Returns a boolean value indicating if this button is disabled or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._disabled;
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._screensharing;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code ToggleCameraButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _screensharing: boolean
 * }}
 */
function _mapStateToProps(state): Object {
    const enabled = getFeatureFlag(state, ANDROID_SCREENSHARING_ENABLED, true);

    return {
        _screensharing: isLocalVideoTrackDesktop(state),
        visible: enabled
    };
}

export default translate(connect(_mapStateToProps)(ScreenSharingAndroidButton));
