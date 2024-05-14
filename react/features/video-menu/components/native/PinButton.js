// @flow
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconPin } from '../../../base/icons/svg';
import { pinParticipant } from '../../../base/participants/actions';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { shouldDisplayTileView } from '../../../video-layout/functions';

/**
 * A remote video menu button which pins a participant and exist the tile view.
 */
class PinButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.show';
    icon = IconPin;
    label = 'videothumbnail.show';

    /**
     * Handles clicking / pressing the button, and kicks the participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        // Pin participant, it will automatically exit the tile view
        dispatch(pinParticipant(this.props.participantID));
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { isOpen } = state['features/participants-pane'];

    return {
        visible: !isOpen && shouldDisplayTileView(state)
    };
}

export default translate(connect(_mapStateToProps)(PinButton));
