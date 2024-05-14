// @flow
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconHangup } from '../../../base/icons/svg';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { incomingCallAnswered } from '../actions';

/**
 * An implementation of a button which accepts/answers an incoming call.
 */
class AnswerButton extends AbstractButton {
    accessibilityLabel = 'incomingCall.answer';
    icon = IconHangup;
    label = 'incomingCall.answer';

    /**
     * Handles clicking / pressing the button, and answers the incoming call.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(incomingCallAnswered());
    }
}

export default translate(connect()(AnswerButton));
