// @flow

import { openDialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { IconPinned } from '../../../../base/icons';
import { connect } from '../../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../../base/toolbox/components';

import PinParticipantsDialog from './PinParticipantsDialog';

type Props = AbstractButtonProps;

/**
 * Implementation of a button for toggling fullscreen state.
 */
class PinParticipantsButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.pinParticipants';
    label = 'toolbar.pinParticipants';
    icon = IconPinned;

    /**
     * Retrieves the tooltip.
     */
    get tooltip() {
        return this.label;
    }

    /**
     * Required by linter due to AbstractButton overwritten prop being writable.
     *
     * @param {string} _value - The value.
     */
    set tooltip(_value) {
        // Unused.
    }

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(openDialog(PinParticipantsDialog));
    }
}

export default translate(connect()(PinParticipantsButton));
