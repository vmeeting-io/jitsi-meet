// @flow

import { translate } from '../../../base/i18n/functions';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';

/**
 * An implementation of a button to raise or lower hand.
 */
class SelectModeratorAndLeave extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.selectModeratorAndLeave';
    label = 'toolbar.selectModeratorAndLeave';
}

export default translate(SelectModeratorAndLeave);
