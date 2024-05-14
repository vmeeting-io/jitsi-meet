// @flow

import { NativeModules, Platform } from 'react-native';
import { connect } from 'react-redux';

import { PIP_ENABLED } from '../../../../base/flags/constants';
import { getFeatureFlag } from '../../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconMenuDown } from '../../../base/icons/svg';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { isLocalVideoTrackDesktop } from '../../../base/tracks/functions.any';
import { enterPictureInPicture } from '../actions';

/**
 * An implementation of a button for entering Picture-in-Picture mode.
 */
class PictureInPictureButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.pip';
    icon = IconMenuDown;
    label = 'toolbar.pip';

    /**
     * Handles clicking / pressing the button.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(enterPictureInPicture());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Node}
     */
    render() {
        return this.props._enabled ? super.render() : null;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code PictureInPictureButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _enabled: boolean
 * }}
 */
function _mapStateToProps(state): Object {
    const flag = Boolean(getFeatureFlag(state, PIP_ENABLED));
    let enabled = flag && !isLocalVideoTrackDesktop(state);

    // Override flag for Android, since it might be unsupported.
    if (Platform.OS === 'android' && !NativeModules.PictureInPicture.SUPPORTED) {
        enabled = false;
    }

    return {
        _enabled: enabled
    };
}

export default translate(connect(_mapStateToProps)(PictureInPictureButton));
