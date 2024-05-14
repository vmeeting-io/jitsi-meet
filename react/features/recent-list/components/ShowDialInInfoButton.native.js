// @flow
import { connect } from 'react-redux';

import { translate } from '../../base/i18n/functions';
import { IconInfo } from '../../base/icons/svg';
import AbstractButton from '../../base/toolbox/components/AbstractButton';
import { screen } from '../../conference/components/native/routes';
import { navigate } from '../../welcome/components/RootNavigationContainerRef';

/**
 * A recent list menu button which opens the dial-in info dialog.
 */
class ShowDialInInfoButton extends AbstractButton {
    accessibilityLabel = 'welcomepage.info';
    icon = IconInfo;
    label = 'welcomepage.info';

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { itemId } = this.props;

        navigate(screen.dialInSummary, {
            summaryUrl: itemId.url
        });
    }
}

export default translate(connect()(ShowDialInInfoButton));
