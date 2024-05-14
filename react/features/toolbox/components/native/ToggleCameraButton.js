// @flow
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconSwitchCamera } from '../../../base/icons/svg';
import { toggleCameraFacingMode } from '../../../base/media/actions';
import { MEDIA_TYPE } from '../../../base/media/constants';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { isLocalTrackMuted } from '../../../base/tracks/functions';

/**
 * An implementation of a button for toggling the camera facing mode.
 */
class ToggleCameraButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.toggleCamera';
    icon = IconSwitchCamera;
    label = 'toolbar.toggleCamera';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(toggleCameraFacingMode());
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._audioOnly || this.props._videoMuted;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code ToggleCameraButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _videoMuted: boolean
 * }}
 */
function _mapStateToProps(state): Object {
    const { enabled: audioOnly } = state['features/base/audio-only'];
    const tracks = state['features/base/tracks'];

    return {
        _audioOnly: Boolean(audioOnly),
        _videoMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO)
    };
}

export default translate(connect(_mapStateToProps)(ToggleCameraButton));
