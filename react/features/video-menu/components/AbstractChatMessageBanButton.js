// @flow

import { openDialog } from '../../base/dialog';
import { IconKick } from '../../base/icons';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import {
    isLocalParticipantModerator
} from '../../base/participants';
import { getParticipantById } from '../../base/participants'
import { BanRemoteParticipantDialog } from '.';

export type Props = AbstractButtonProps & {

    /**
     * True if the user has been disabled for chat messages
     */
    _isChatMessageDisabled: Boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * An abstract remote video menu button which kicks the remote participant.
 */
export default class AbstractChatMessageBanButton<P: Props> extends AbstractButton<P, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.banUser';
    icon = IconKick;
    label = 'dialog.banUser';
    // toggledLabel = 'dialog.unbanUser';


    /**
     * Handles clicking / pressing the button, and kicks the participant.
     * @override
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;
        
        // get the participantID for whom the action is to be dispatched
        let participantID = this.props.message.id;

        dispatch(openDialog(BanRemoteParticipantDialog , { participantID }));
    }

    // _isToggled() {
    //     return this.props._isChatMessageDisabled;
    // }
}

export function _mapStateToProps(state: Object, ownProps: Props): Object {
    let { visible } = ownProps;

    return {
        visible
    };
}
