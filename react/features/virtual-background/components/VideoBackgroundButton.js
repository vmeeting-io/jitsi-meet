import { connect } from 'react-redux';

import { translate } from '../../base/i18n/functions';
import { IconImage } from '../../base/icons/svg';
import AbstractButton from '../../base/toolbox/components/AbstractButton';
import { isScreenVideoShared } from '../../screen-share/functions';
import { openSettingsDialog } from '../../settings/actions';
import { SETTINGS_TABS } from '../../settings/constants';
import { checkBlurSupport, checkVirtualBackgroundEnabled } from '../functions';

/**
 * An abstract implementation of a button that toggles the video background dialog.
 */
class VideoBackgroundButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.selectBackground';
    icon = IconImage;
    label = 'toolbar.selectBackground';
    tooltip = 'toolbar.selectBackground';

    /**
     * Handles clicking / pressing the button, and toggles the virtual background dialog
     * state accordingly.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        dispatch(openSettingsDialog(SETTINGS_TABS.VIRTUAL_BACKGROUND));
    }

    /**
     * Returns {@code boolean} value indicating if the background effect is
     * enabled or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isBackgroundEnabled;
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
function _mapStateToProps(state) {

    return {
        _isBackgroundEnabled: Boolean(state['features/virtual-background'].backgroundEffectEnabled),
        visible: checkBlurSupport()
        && !isScreenVideoShared(state)
        && checkVirtualBackgroundEnabled(state)
    };
}

export default translate(connect(_mapStateToProps)(VideoBackgroundButton));
