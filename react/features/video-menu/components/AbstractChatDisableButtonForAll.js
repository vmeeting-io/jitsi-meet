// @flow

import { openDialog } from '../../base/dialog';
import { IconMessage } from '../../base/icons';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import {
    isLocalParticipantModerator,
    isEveryoneModerator
} from '../../base/participants';
import { EnableChatForAllParticipantsDialog, DisableChatForAllParticipantsDialog } from '.';

export type Props = AbstractButtonProps & {

    /**
     * Will need to figure out which prop to use, because we are not using chat message here
     */
    _isChatForAllDisabled: Boolean,

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
export default class AbstractChatDisableButtonForAll<P: Props> extends AbstractButton<P, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.kick';
    icon = IconMessage;
    label = 'dialog.disableChatForAll';
    toggledLabel = 'dialog.enableChatForAll';

    /**
     * Handles clicking / pressing the button, and kicks the participant.
     * @override
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { _isChatForAllDisabled, dispatch } = this.props;

        //let predefinedRole = getParticipantById(APP.store.getState(), participantID).role;

        // based on what role the current participant is occupying, we can identify whether chat is enabled or disabled
        // when the role of participant is a visitor, he has 'no voice', so when the the popup menu item is clicked
        // it should open the enable chat dialog
        if(_isChatForAllDisabled) {
            // dispatch necessary actions via a dialog box for the participant
            dispatch(openDialog(EnableChatForAllParticipantsDialog));
        }
        // otherwise, it should open the disable chat dialog
        else {
            // dispatch necessary actions via a dialog box for the participant
            dispatch(openDialog(DisableChatForAllParticipantsDialog));
        }
    }

    _isToggled() {
        return this.props._isChatForAllDisabled;
    }
}

export function _mapStateToProps(state: Object, ownProps: Props): Object {
    let { visible } = ownProps;

    const isModerator = isLocalParticipantModerator(state);
    visible = isModerator;
    
    return {
        _isChatForAllDisabled: isEveryoneModerator(state),
        visible
    };
}
