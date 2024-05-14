import { connect } from 'react-redux';

import { translate } from '../../base/i18n/functions';
import {
    IconNoiseSuppressionOff,
    IconNoiseSuppressionOn
} from '../../base/icons/svg';
import AbstractButton from '../../base/toolbox/components/AbstractButton';
import { setOverflowMenuVisible } from '../../toolbox/actions';
import { toggleNoiseSuppression } from '../actions';
import { isNoiseSuppressionEnabled } from '../functions';


/**
 * Component that renders a toolbar button for toggling noise suppression.
 */
class NoiseSuppressionButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.noiseSuppression';
    icon = IconNoiseSuppressionOn;
    label = 'toolbar.noiseSuppression';
    tooltip = 'toolbar.noiseSuppression';
    toggledIcon = IconNoiseSuppressionOff;
    toggledLabel = 'toolbar.disableNoiseSuppression';

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        dispatch(toggleNoiseSuppression());
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
        return this.props._isNoiseSuppressionEnabled;
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
    return {
        _isNoiseSuppressionEnabled: isNoiseSuppressionEnabled(state)
    };
}

export default translate(connect(_mapStateToProps)(NoiseSuppressionButton));
