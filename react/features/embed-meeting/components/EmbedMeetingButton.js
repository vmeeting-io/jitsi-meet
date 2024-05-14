// @flow
import { connect } from 'react-redux';

import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { openDialog } from '../../base/dialog/actions';
import { translate } from '../../base/i18n/functions';
import { IconCode } from '../../base/icons/svg';
import AbstractButton from '../../base/toolbox/components/AbstractButton';

import EmbedMeetingDialog from './EmbedMeetingDialog';

/**
 * Implementation of a button for opening embed meeting dialog.
 */
class EmbedMeetingButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.embedMeeting';
    icon = IconCode;
    label = 'toolbar.embedMeeting';
    tooltip = 'toolbar.embedMeeting';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
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

        sendAnalytics(createToolbarEvent('embed.meeting'));
        dispatch(openDialog(EmbedMeetingDialog));
    }
}

export default translate(connect()(EmbedMeetingButton));
