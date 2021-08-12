// @flow

import { translate } from '../../base/i18n';
import { IconParticipants } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { getParticipantsPaneOpen } from '../functions';

/**
 * The type of the React {@code Component} props of {@link ParticipantsPaneButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * External handler for click action.
     */
    handleClick: Function
};

/**
 * Implementation of a button for accessing participants pane.
 */
class ParticipantsPaneButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.participants';
    icon = IconParticipants;
    label = 'toolbar.participants';
    tooltip = 'toolbar.participants';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.handleClick();
    }

    _isToggled() {
        return this.props._participantsPaneOpen;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
const mapStateToProps = state => {
    return {
        _participantsPaneOpen: getParticipantsPaneOpen(state)
    };
};

export default translate(connect(mapStateToProps)(ParticipantsPaneButton));
