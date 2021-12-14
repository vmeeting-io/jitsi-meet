// @flow

import { openDialog } from '../../base/dialog';
import { IconMessage } from '../../base/icons';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import {
    isLocalParticipantModerator
} from '../../base/participants';
import { getParticipantById } from '../../base/participants'
import { EnableChatForRemoteParticipantDialog, DisableChatForRemoteParticipantDialog } from '.';

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
export default class AbstractChatMessageDisableButton<P: Props> extends AbstractButton<P, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.kick';
    icon = IconMessage;
    label = 'dialog.disableChat';
    toggledLabel = 'dialog.enableChat';


    /**
     * Handles clicking / pressing the button, and kicks the participant.
     * @override
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { _isChatMessageDisabled, dispatch } = this.props;
        
        // get the participantID for whom the action is to be dispatched
        let participantID = this.props.message.id;

        //let predefinedRole = getParticipantById(APP.store.getState(), participantID).role;

        // based on what role the current participant is occupying, we can identify whether chat is enabled or disabled
        // when the role of participant is a visitor, he has 'no voice', so when the the popup menu item is clicked
        // it should open the enable chat dialog
        if(_isChatMessageDisabled) {
            // dispatch necessary actions via a dialog box for the participant
            dispatch(openDialog(EnableChatForRemoteParticipantDialog , { participantID }));
        }
        // otherwise, it should open the disable chat dialog
        else {   
            // dispatch necessary actions via a dialog box for the participant
            dispatch(openDialog(DisableChatForRemoteParticipantDialog, { participantID }));
        }
    }

    _isToggled() {
        return this.props._isChatMessageDisabled;
    }
}

export function _mapStateToProps(state: Object, ownProps: Props): Object {
    let { visible } = ownProps;

    const isModerator = isLocalParticipantModerator(state);
    visible = isModerator;
    let participantID = ownProps.message.id;
    let userRole = getParticipantById(APP.store.getState(), participantID).role;
    return {
        _isChatMessageDisabled: Boolean(userRole === "visitor"),
        visible
    };
}
