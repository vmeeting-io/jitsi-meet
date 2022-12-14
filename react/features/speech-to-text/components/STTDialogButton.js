// @flow

import { translate } from '../../base/i18n';
import { IconClosedCaption } from '../../base/icons';
import { connect } from '../../base/redux';

import {
    AbstractSTTDialogButton,
    _abstractMapStateToProps
} from './AbstractSTTDialogButton';

/**
 * A button which starts/stops the transcriptions.
 */
class STTDialogButton
    extends AbstractSTTDialogButton {

    accessibilityLabel = 'toolbar.accessibilityLabel.cc';
    icon = IconClosedCaption;
    tooltip = 'stt.buttonTooltip';
    label = 'toolbar.stt';
}

export default translate(connect(_abstractMapStateToProps)(STTDialogButton));
