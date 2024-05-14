// @flow

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { openDialog } from '../../base/dialog/actions';
import { IconVideoOff } from '../../base/icons/svg';
import AbstractButton from '../../base/toolbox/components/AbstractButton';

import { MuteEveryonesVideoDialog } from './';

/**
 * An abstract remote video menu button which disables the camera of all the other participants.
 */
export default class AbstractMuteEveryoneElsesVideoButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.muteEveryoneElsesVideoStream';
    icon = IconVideoOff;
    label = 'videothumbnail.domuteVideoOfOthers';

    /**
     * Handles clicking / pressing the button, and opens a confirmation dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participantID } = this.props;

        sendAnalytics(createToolbarEvent('mute.everyoneelsesvideo.pressed'));
        dispatch(openDialog(MuteEveryonesVideoDialog, { exclude: [ participantID ] }));
    }
}
