// @flow
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconHangup } from '../../../base/icons/svg';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { incomingCallDeclined } from '../actions';

/**
 * An implementation of a button which declines/rejects an incoming call.
 */
class DeclineButton extends AbstractButton {
    accessibilityLabel = 'incomingCall.decline';
    icon = IconHangup;
    label = 'incomingCall.decline';

    /**
     * Handles clicking / pressing the button, and declines the incoming call.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(incomingCallDeclined());
    }
}

export default translate(connect()(DeclineButton));
