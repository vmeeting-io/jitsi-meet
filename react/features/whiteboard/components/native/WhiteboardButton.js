import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconWhiteboard } from '../../../base/icons/svg';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { setWhiteboardOpen } from '../../actions.any';
import { isWhiteboardButtonVisible } from '../../functions';

/**
 * Component that renders a toolbar button for the whiteboard.
 */
class WhiteboardButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.showWhiteboard';
    icon = IconWhiteboard;
    label = 'toolbar.showWhiteboard';
    tooltip = 'toolbar.showWhiteboard';

    /**
     * Handles clicking / pressing the button, and opens the whiteboard view.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(setWhiteboardOpen(true));
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
        visible: isWhiteboardButtonVisible(state)
    };
}

export default translate(connect(_mapStateToProps)(WhiteboardButton));
