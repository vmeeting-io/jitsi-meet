// @flow
import { connect } from 'react-redux';

import { openDialog } from '../../base/dialog/actions';
import { translate } from '../../base/i18n/functions';
import { IconImage } from '../../base/icons/svg';
import AbstractButton from '../../base/toolbox/components/AbstractButton';
import { isScreenVideoShared } from '../../screen-share/functions';
import { checkBlurSupport, checkVirtualAvatarEnabled } from '../functions';

import VirtualAvatarDialog from './VirtualAvatarDialog';

/**
 * An abstract implementation of a button that toggles the video background dialog.
 */
class VirtualAvatarButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.selectVirtualAvatar';
    icon = IconImage;
    label = 'toolbar.selectVirtualAvatar';
    tooltip = 'toolbar.selectVirtualAvatar';

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

    /**
     * Handles clicking / pressing the button, and toggles the virtual background dialog
     * state accordingly.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        dispatch(openDialog(VirtualAvatarDialog));
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
            && !isScreenVideoShared(state)
            && checkVirtualAvatarEnabled(state)
    };
}

export default translate(connect(_mapStateToProps)(VirtualAvatarButton));
