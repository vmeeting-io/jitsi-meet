// @flow
import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { translate } from '../../../base/i18n/functions';
import { IconGear } from '../../../base/icons/svg';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { openSettingsDialog } from '../../actions';

/**
 * An abstract implementation of a button for accessing settings.
 */
class SettingsButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.Settings';
    icon = IconGear;
    label = 'toolbar.Settings';
    tooltip = 'toolbar.Settings';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, isDisplayedOnWelcomePage = false } = this.props;

        sendAnalytics(createToolbarEvent('settings'));
        dispatch(openSettingsDialog(undefined, isDisplayedOnWelcomePage));
    }
}

export default translate(connect()(SettingsButton));
