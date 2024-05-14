// @flow

import { arApprovalDialog } from '../../ar-effect/actions';
import { enableARHat } from '../../ar-effect/functions';
import { IconBirthdayHat } from '../../base/icons/svg';
import { updateParticipantBirthdayHatFlag } from '../../base/participants/actions';
import { getLocalParticipant, getParticipantByIdOrUndefined } from '../../base/participants/functions';
import AbstractButton from '../../base/toolbox/components/AbstractButton';
import { notifyBirthdayHatOn } from '../../participants-pane/actions.any';

/**
 * An abstract remote video menu button which mutes the remote participant.
 */
export default class AbstractBirthdayHatButton extends AbstractButton {
    accessibilityLabel = '';
    icon = IconBirthdayHat;
    label = '';

    /**
     * Handles clicking / pressing the button, and mutes the participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { _isHatOn, _localDisplayName, dispatch, participantID } = this.props;

        if (_isHatOn) {
            dispatch(updateParticipantBirthdayHatFlag(participantID, false));
            dispatch(arApprovalDialog(false));
            enableARHat(dispatch,false); 
        } else {
            dispatch(updateParticipantBirthdayHatFlag(participantID, true));
            dispatch(notifyBirthdayHatOn(_localDisplayName, participantID));
        }
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @private
 * @returns {{
 *      _audioTrackMuted: boolean
 *  }}
 */
export function _mapStateToProps(state: Object, ownProps: Props) {
    const _participant = getParticipantByIdOrUndefined(state, ownProps.participantID);
    const _isHatOn = _participant?.hatOn;
    const _localDisplayName = getLocalParticipant(state)?.name;

    return {
        _isHatOn,
        _localDisplayName,
        _participant,
    };
}
