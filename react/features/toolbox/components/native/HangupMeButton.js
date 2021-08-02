// @flow

import { translate } from '../../../base/i18n';
import { IconHangup } from '../../../base/icons';
import { AbstractButton } from '../../../base/toolbox/components';

/**
 * An implementation of a button to raise or lower hand.
 */
class HangupMeButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.hangup';
    icon = IconHangup;
    label = 'toolbar.hangup';
}

export default translate(HangupMeButton);
