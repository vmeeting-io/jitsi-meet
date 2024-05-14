import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconDotsHorizontal } from '../../../base/icons/svg';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';


/**
 * Implementation of a button for toggling the overflow menu.
 */
class OverflowToggleButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.moreActions';
    toggledAccessibilityLabel = 'toolbar.accessibilityLabel.closeMoreActions';
    icon = IconDotsHorizontal;
    label = 'toolbar.moreActions';
    toggledLabel = 'toolbar.moreActions';
    tooltip = 'toolbar.moreActions';

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


export default connect()(translate(OverflowToggleButton));
