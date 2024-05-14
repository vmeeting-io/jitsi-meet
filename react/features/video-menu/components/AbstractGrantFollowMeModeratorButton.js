// @flow

import { openDialog } from '../../base/dialog/actions';
import { IconUserFollow } from '../../base/icons/svg';
import { PARTICIPANT_ROLE } from '../../base/participants/constants';
import { getLocalParticipant } from '../../base/participants/functions';
import AbstractButton from '../../base/toolbox/components/AbstractButton';
import { getFollowMeModerator } from '../../follow-me/functions';

import { GrantFollowMeModeratorDialog } from './';

export type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The ID of the participant for whom to grant moderator status.
     */
    participantID: string,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * An abstract remote video menu button which kicks the remote participant.
 */
export default class AbstractGrantFollowMeModeratorButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'videothumbnail.grantFollowMeModerator';
    icon = IconUserFollow;
    label = 'videothumbnail.grantFollowMeModerator';

    /**
     * Handles clicking / pressing the button, and kicks the participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { _isFollowMeModerator, dispatch, participantID } = this.props;

        dispatch(openDialog(GrantFollowMeModeratorDialog, { _isFollowMeModerator, participantID }));
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @private
 * @returns {{
 *     visible: boolean
 * }}
 */
export function _mapStateToProps(state: Object, ownProps: Props) {
    const localParticipant = getLocalParticipant(state);

    return {
        _isFollowMeModerator: getFollowMeModerator(state) === ownProps.participantID,
        visible: Boolean(localParticipant?.role === PARTICIPANT_ROLE.MODERATOR)
    };
}
