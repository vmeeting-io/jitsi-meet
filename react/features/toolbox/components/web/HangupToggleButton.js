import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconCloseLarge, IconHangup } from '../../../base/icons/svg';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';

/**
 * Implementation of a button for toggling the hangup menu.
 */
class HangupToggleButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.hangup';
    icon = IconHangup;
    label = 'toolbar.hangup';
    toggledIcon = IconCloseLarge;
    toggledLabel = 'toolbar.hangup';
    tooltip = 'toolbar.hangup';

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props.isOpen;
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
}

export default connect()(translate(HangupToggleButton));
