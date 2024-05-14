// @flow

import { translate } from '../../../base/i18n/functions';
import { IconHangup } from '../../../base/icons/svg';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';

/**
 * An implementation of a button to raise or lower hand.
 */
class HangupMeButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.hangup';
    icon = IconHangup;
    label = 'toolbar.hangup';
}

export default translate(HangupMeButton);
