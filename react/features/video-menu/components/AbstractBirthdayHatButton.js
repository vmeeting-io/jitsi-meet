// @flow

import { arApprovalDialog, enableARHat } from '../../ar-effect';
import { IconBirthdayHat } from '../../base/icons';
import { getLocalParticipant, getParticipantByIdOrUndefined, updateParticipantBirthdayHatFlag } from '../../base/participants';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { notifyBirthdayHatOn } from '../../participants-pane/actions.any';

export type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The ID of the participant object that this button is supposed to
     * mute/unmute.
     */
    participantID: string,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * An abstract remote video menu button which mutes the remote participant.
 */
export default class AbstractBirthdayHatButton extends AbstractButton<Props, *> {
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
