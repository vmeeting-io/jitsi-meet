import { connect } from 'react-redux';

import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { openDialog } from '../../base/dialog/actions';
import { translate } from '../../base/i18n/functions';
import { IconPerformance } from '../../base/icons/svg';
import AbstractButton from '../../base/toolbox/components/AbstractButton';

import VideoQualityDialog from './VideoQualityDialog.web';

/**
 * React {@code Component} responsible for displaying a button in the overflow
 * menu of the toolbar, including an icon showing the currently selected
 * max receive quality.
 *
 * @augments Component
 */
class VideoQualityButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.callQuality';
    label = 'videoStatus.performanceSettings';
    tooltip = 'videoStatus.performanceSettings';
    icon = IconPerformance;

    /**
    * Handles clicking the button, and opens the video quality dialog.
    *
    * @private
    * @returns {void}
    */
    _handleClick() {
        const { dispatch } = this.props;

        sendAnalytics(createToolbarEvent('video.quality'));

        dispatch(openDialog(VideoQualityDialog));
    }
}

export default connect()(translate(VideoQualityButton));
