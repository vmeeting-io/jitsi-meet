import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconCameraRefresh } from '../../../base/icons/svg';
import { MEDIA_TYPE } from '../../../base/media/constants';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { toggleCamera } from '../../../base/tracks/actions';
import { isLocalTrackMuted, isToggleCameraEnabled } from '../../../base/tracks/functions';
import { setOverflowMenuVisible } from '../../actions.web';


/**
 * An implementation of a button for toggling the camera facing mode.
 */
class ToggleCameraButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.toggleCamera';
    icon = IconCameraRefresh;
    label = 'toolbar.toggleCamera';

    /**
     * Handles clicking/pressing the button.
     *
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        dispatch(toggleCamera());
        dispatch(setOverflowMenuVisible(false));
    }

    /**
     * Whether this button is disabled or not.
     *
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
 * @returns {IProps}
 */
function mapStateToProps(state) {
    const { enabled: audioOnly } = state['features/base/audio-only'];
    const tracks = state['features/base/tracks'];

    return {
        _audioOnly: Boolean(audioOnly),
        _videoMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO),
        visible: isToggleCameraEnabled(state)
    };
}

export default translate(connect(mapStateToProps)(ToggleCameraButton));
