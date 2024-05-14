// @flow
import { connect } from 'react-redux';

import { translate } from '../../base/i18n/functions';
import { IconSubtitles } from '../../base/icons/svg';

import {
    AbstractSTTDialogButton,
    _abstractMapStateToProps
} from './AbstractSTTDialogButton';

/**
 * A button which starts/stops the transcriptions.
 */
class STTDialogButton extends AbstractSTTDialogButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.cc';
    icon = IconSubtitles;
    tooltip = 'stt.buttonTooltip';
    label = 'toolbar.stt';
}

export default translate(connect(_abstractMapStateToProps)(STTDialogButton));
