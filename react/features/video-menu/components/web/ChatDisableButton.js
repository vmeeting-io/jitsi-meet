// @flow

import React, { Component } from 'react';

import { translate } from '../../../base/i18n';
import { IconMessage } from '../../../base/icons';
import { connect } from '../../../base/redux';
import {
    isLocalParticipantModerator
} from '../../../base/participants';
import { getParticipantById } from '../../../base/participants'

import RemoteVideoMenuButton from './RemoteVideoMenuButton';
import { openDialog } from '../../../base/dialog';
import { DisableChatForRemoteParticipantDialog, EnableChatForRemoteParticipantDialog } from '.';

declare var interfaceConfig: Object;


export type Props = {

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
 * A custom implementation of the PrivateMessageButton specialized for
 * the web version of the remote video menu. When the web platform starts to use
 * the {@code AbstractButton} component for the remote video menu, we can get rid
 * of this component and use the generic button in the chat feature.
 */
class ChatDisableButton extends Component<Props> {
    /**
     * Instantiates a new Component instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */


    render() {
        const { participantID, _isChatMessageDisabled, t, dispatch } = this.props;

        if(!_isChatMessageDisabled) {
            return (
                <RemoteVideoMenuButton
                    buttonText = { t('toolbar.disableChat') }
                    icon = { IconMessage } // should replace icon message with approriate SVG
                    id = { `privmsglink_${participantID}` }
                    onClick = { this._onClick } />
            );
        } else {
            return (
                <RemoteVideoMenuButton
                    buttonText = { t('toolbar.enableChat') }
                    icon = { IconMessage } // should replace icon message with approriate SVG
                    id = { `privmsglink_${participantID}` }
                    onClick = { this._onClick } />
            );
        }
        
    }

    _onClick: () => void

    /**
     * Callback to be invoked on pressing the button.
     *
     * @returns {void}
     */
     _onClick() {
        const { dispatch, participantID, _isChatMessageDisabled } = this.props;
        
        if(!_isChatMessageDisabled) {
            // dispatch necessary actions via a dialog box for the participant
            dispatch(openDialog(DisableChatForRemoteParticipantDialog , { participantID } ));
        } else {
            dispatch(openDialog(EnableChatForRemoteParticipantDialog , { participantID } ));
        }
        
    }

}

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {Props}
 */
 export function _mapStateToProps(state: Object, ownProps: Props): Object {
    let { visible } = ownProps;

    const isModerator = isLocalParticipantModerator(state);
    visible = isModerator;

    let participantID = ownProps.participantID;
    let userRole = getParticipantById(APP.store.getState(), participantID).role;
    return {
        _isChatMessageDisabled: Boolean(userRole === "visitor"),
        dispatch: ownProps.dispatch,
        visible
    };
}

// export function _mapDispatchToProps(dispatch: Function): $Shape<Props> {
//     return {
//         openDialog: func => {
//             dispatch(openDialog(func));
//         }
//     };
// }


export default translate(connect(_mapStateToProps)(ChatDisableButton));
