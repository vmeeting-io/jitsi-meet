// @flow

import React, { Component } from 'react';

import { translate } from '../../../base/i18n';
import { IconMessage } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { isEveryoneModerator, isLocalParticipantModerator } from '../../../base/participants'

import RemoteVideoMenuButton from './RemoteVideoMenuButton';
import { openDialog } from '../../../base/dialog';
import { DisableChatForAllParticipantsDialog, EnableChatForAllParticipantsDialog } from '.';


export type Props = {

    /**
     * True if the chat has been disabled for all normal participants
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
 * A custom implementation of the PrivateMessageButton specialized for
 * the web version of the remote video menu. When the web platform starts to use
 * the {@code AbstractButton} component for the remote video menu, we can get rid
 * of this component and use the generic button in the chat feature.
 */
class AllChatDisableButton extends Component<Props> {
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
        const { participantID, _isChatForAllDisabled, t } = this.props;

        if(!_isChatForAllDisabled) {
            return (
                <RemoteVideoMenuButton
                    buttonText = { t('toolbar.disableChatForAll') }
                    icon = { IconMessage } // should replace icon message with approriate SVG
                    id = { `privmsglink_${participantID}` }
                    onClick = { this._onClick } />
            );
        } else {
            return (
                <RemoteVideoMenuButton
                    buttonText = { t('toolbar.enableChatForAll') }
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
        const { dispatch, participantID, _isChatForAllDisabled } = this.props;
        
        if(!_isChatForAllDisabled) {
            // dispatch necessary actions via a dialog box for the participant
            dispatch(openDialog(DisableChatForAllParticipantsDialog , { participantID } ));
        } else {
            dispatch(openDialog(EnableChatForAllParticipantsDialog , { participantID } ));
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
    
    return {
        _isChatForAllDisabled: isEveryoneModerator(state),
        visible
    };
}

export default translate(connect(_mapStateToProps)(AllChatDisableButton));
