
// @flow
import { connect } from 'react-redux';

import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { translate } from '../../base/i18n/functions';
import { IconFeedback } from '../../base/icons/svg';
import AbstractButton from '../../base/toolbox/components/AbstractButton';
import { openFeedbackDialog } from '../actions';

/**
 * Implementation of a button for opening feedback dialog.
 */
class FeedbackButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.feedback';
    icon = IconFeedback;
    label = 'toolbar.feedback';
    tooltip = 'toolbar.feedback';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { _conference, dispatch, handleClick } = this.props;

        if (handleClick) {
            handleClick();

            return;
        }

        sendAnalytics(createToolbarEvent('feedback'));
        dispatch(openFeedbackDialog(_conference));
    }
}

const mapStateToProps = state => {
    return {
        _conference: state['features/base/conference'].conference
    };
};

export default translate(connect(mapStateToProps)(FeedbackButton));
