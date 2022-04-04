// @flow

import { openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { IconVirtualBackground } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton } from '../../base/toolbox/components';
import type { AbstractButtonProps } from '../../base/toolbox/components';
import { checkBlurSupport } from '../functions';

import { VirtualAvatarDialog } from './index';

/**
 * The type of the React {@code Component} props of {@link VirtualAvatarButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * True if the video background is blurred or false if it is not.
     */
    _isVirtualAvatarEnabled: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * An abstract implementation of a button that toggles the video background dialog.
 */
class VirtualAvatarButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.selectVirtualAvatar';
    icon = IconVirtualBackground;
    label = 'toolbar.selectVirtualAvatar';
    tooltip = 'toolbar.selectVirtualAvatar';

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

        dispatch(openDialog(VirtualAvatarDialog));
    }

    /**
     * Returns {@code boolean} value indicating if the background effect is
     * enabled or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isVirtualAvatarEnabled;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VirtualAvatarButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _isVirtualAvatarEnabled: boolean
 * }}
 */
function _mapStateToProps(state): Object {

    return {
        _isVirtualAvatarEnabled: Boolean(state['features/virtual-avatar'].virtualAvatarEffectEnabled),
        visible: checkBlurSupport()
    };
}

export default translate(connect(_mapStateToProps)(VirtualAvatarButton));
