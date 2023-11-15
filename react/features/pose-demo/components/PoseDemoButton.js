// @flow

import { openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { IconModerator } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton } from '../../base/toolbox/components';
import { isLocalParticipantModerator } from '../../base/participants';
import type { AbstractButtonProps } from '../../base/toolbox/components';


import { PoseDemoDialog } from './index';

/**
 * The type of the React {@code Component} props of {@link VideoBackgroundButton}.
 */
type Props = AbstractButtonProps & {
    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * An abstract implementation of a button that toggles the video background dialog.
 */
class PoseDemoButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.posedemo';
    icon = IconModerator;
    label = 'toolbar.posedemo';
    tooltip = 'toolbar.posedemo';

    /**
     * Handles clicking / pressing the button, and toggles the virtual background dialog
     * state accordingly.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, handleClick } = this.props;

        if (handleClick) {
            handleClick();

            return;
        }

        dispatch(openDialog(PoseDemoDialog));
    }

    /**
     * Returns {@code boolean} value indicating if the background effect is
     * enabled or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._enabled;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VideoBackgroundButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _isBackgroundEnabled: boolean
 * }}
 */
function _mapStateToProps(state: Object, ownProps: Props) {
    const visible = true;

    return {
        visible: visible
    };
}

export default translate(connect(_mapStateToProps)(PoseDemoButton));