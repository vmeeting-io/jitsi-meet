// @flow
import { connect } from 'react-redux';

import { openDialog } from '../../../base/dialog/actions';
import { OVERFLOW_MENU_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconDotsHorizontal } from '../../../base/icons/svg';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';

import OverflowMenu from './OverflowMenu';

/**
 * An implementation of a button for showing the {@code OverflowMenu}.
 */
class OverflowMenuButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.moreActions';
    icon = IconDotsHorizontal;
    label = 'toolbar.moreActions';

    /**
     * Handles clicking / pressing this {@code OverflowMenuButton}.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props._timer.pause();
        this.props.dispatch(openDialog(OverflowMenu));
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code OverflowMenuButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state): Object {
    const enabledFlag = getFeatureFlag(state, OVERFLOW_MENU_ENABLED, true);

    return {
        _timer: state['features/toolbox'].timer,
        visible: enabledFlag
    };
}

export default translate(connect(_mapStateToProps)(OverflowMenuButton));
