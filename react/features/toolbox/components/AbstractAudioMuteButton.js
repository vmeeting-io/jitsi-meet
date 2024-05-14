import { AUDIO_MUTE_BUTTON_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { MEDIA_TYPE } from '../../base/media/constants';
import BaseAudioMuteButton from '../../base/toolbox/components/BaseAudioMuteButton';
import { isLocalTrackMuted } from '../../base/tracks/functions';
import { muteLocal } from '../../video-menu/actions';
import { isAudioMuteButtonDisabled } from '../functions';


/**
 * Component that renders a toolbar button for toggling audio mute.
 *
 * @augments BaseAudioMuteButton
 */
export default class AbstractAudioMuteButton extends BaseAudioMuteButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.mute';
    toggledAccessibilityLabel = 'toolbar.accessibilityLabel.unmute';
    label = 'toolbar.mute';
    toggledLabel = 'toolbar.unmute';
    tooltip = 'toolbar.mute';
    toggledTooltip = 'toolbar.unmute';

    /**
     * Indicates if audio is currently muted or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isAudioMuted() {
        return this.props._audioMuted;
    }

    /**
     * Changes the muted state.
     *
     * @param {boolean} audioMuted - Whether audio should be muted or not.
     * @protected
     * @returns {void}
     */
    _setAudioMuted(audioMuted: boolean) {
        this.props.dispatch(muteLocal(audioMuted, MEDIA_TYPE.AUDIO));
    }

    /**
     * Return a boolean value indicating if this button is disabled or not.
     *
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._disabled;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code AbstractAudioMuteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioMuted: boolean,
 *     _disabled: boolean
 * }}
 */
export function mapStateToProps(state) {
    const _audioMuted = isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.AUDIO);
    const _disabled = isAudioMuteButtonDisabled(state);
    const enabledFlag = getFeatureFlag(state, AUDIO_MUTE_BUTTON_ENABLED, true);

    return {
        _audioMuted,
        _disabled,
        visible: enabledFlag
    };
}
