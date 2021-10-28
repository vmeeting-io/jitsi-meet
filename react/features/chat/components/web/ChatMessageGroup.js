// @flow

import DropdownMenu, { DropdownItem, DropdownItemGroup } from '@atlaskit/dropdown-menu';
import React, { Component } from 'react';

import { Avatar } from '../../../base/avatar';
import { openDialog } from '../../../base/dialog';
import { getLocalizedDateFormatter, translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { getLocalParticipant, getParticipantById } from '../../../base/participants';
import KickRemoteParticipantDialog from '../../../video-menu/components/web/KickRemoteParticipantDialog';

import EnableChatForRemoteParticipantDialog from '../../../video-menu/components/web/EnableChatForRemoteParticipantDialog';
import DisableChatForRemoteParticipantDialog from '../../../video-menu/components/web/DisableChatForRemoteParticipantDialog';
import { setPrivateMessageRecipient } from '../../actions';

import ChatMessage from './ChatMessage';

type Props = {

    /**
     * Additional CSS classes to apply to the root element.
     */
    className: string,

    /**
     * The messages to display as a group.
     */
    messages: Array<Object>,
};

/**
 * Displays a list of chat messages. Will show only the display name for the
 * first chat message and the timestamp for the last chat message.
 *
 * @extends React.Component
 */
class ChatMessageGroup extends Component<Props> {
    static defaultProps = {
        className: ''
    };

    constructor(props) {
        super(props);

        this._onToggleChatState = this._onToggleChatState.bind(this);
        this._onKickUser = this._onKickUser.bind(this);
        this._onPrivateMessage = this._onPrivateMessage.bind(this);
    }

    _onKickUser: () => void;

    _onKickUser() {
        const { dispatch, messages } = this.props;
        dispatch(openDialog(KickRemoteParticipantDialog, { participantID: messages[0].id }));
    }

    _onPrivateMessage: () => void;

    _onPrivateMessage() {
        const { dispatch, _participant } = this.props;
        if (_participant) {
            dispatch(setPrivateMessageRecipient(_participant));
        }
    }

    _onToggleChatState: () => void;

    _onToggleChatState() {
        const { _isChatMessageDisabled, _participant, dispatch } = this.props;
        
        // get the participantID for whom the action is to be dispatched
        const participantID = _participant?.id;

        // based on what role the current participant is occupying, we can identify whether chat is enabled or disabled
        // when the role of participant is a visitor, he has 'no voice', so when the the popup menu item is clicked
        // it should open the enable chat dialog
        if(_isChatMessageDisabled) {
            // dispatch necessary actions via a dialog box for the participant
            dispatch(openDialog(EnableChatForRemoteParticipantDialog, { participantID }));
        }
        // otherwise, it should open the disable chat dialog
        else {   
            // dispatch necessary actions via a dialog box for the participant
            dispatch(openDialog(DisableChatForRemoteParticipantDialog, { participantID }));
        }
    }

    /**
     * Renders the display name of the sender.
     *
     * @returns {React$Element<*>}
     */
    _renderDisplayName({ displayName }) {
        return (
            <div
                aria-hidden = { true }
                className = 'display-name'>
                { displayName }
            </div>
        );
    }

    /**
     * Render control button on the sender's name on the chat history section
     * 
     * @returns {Icon} 
     */
    _renderAvatar = () => {
        const { _isChatMessageDisabled, _isLocalParticipantAModerator, messages, t } = this.props;
        const avatar = (
            <Avatar 
                className = 'chat-avatar'
                participantId = { messages[0].id }
                size = { 32 } />
        );

        //we want to only allow moderators to get the chat control button alongside chat message
        if (_isLocalParticipantAModerator) {
            return(
                <DropdownMenu
                    boundariesElement = 'scrollParent'
                    trigger = { avatar }>
                    <DropdownItemGroup>
                        <DropdownItem onClick = { this._onPrivateMessage }>
                            { t('dialog.privateMessage') }
                        </DropdownItem>
                        <DropdownItem onClick = { this._onToggleChatState }>
                            { _isChatMessageDisabled ? t('dialog.enableChat') : t('dialog.disableChat') }
                        </DropdownItem>
                        <DropdownItem onClick = { this._onKickUser }>
                            { t('dialog.kickOut') }
                        </DropdownItem>
                    </DropdownItemGroup>
                </DropdownMenu>
            );
        } else {
            return avatar;
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const formattedTS = [];
        const { _isLocal, className, messages } = this.props;

        const messagesLength = messages.length;

        // loop through each message object and get the formatted timestamp for each message
        messages.forEach((m, i) => {
            formattedTS[i] = getLocalizedDateFormatter(new Date(m.timestamp)).format("H:mm");
        });

        // create an array to decide whether or not to show timestamp for each message; initially all values set to true
        const showTSArray = Array(messagesLength).fill(true);

        // loop through formattedTS array and check for same timestamp values 
        // if same, the previous index value for showTS array is set to false
        for(let i = 0, j = 1; i < j && j < messagesLength ; i++, j++) {
            if(formattedTS[i] === formattedTS[j]) {
                showTSArray[i] = false;
            }
        }

        if (!messagesLength) {
            return null;
        }

        return (
            <div className = { `chat-message-group ${className}` }>
                { !_isLocal && this._renderAvatar() }
                <div className = 'messages'>
                    { !_isLocal && this._renderDisplayName(messages[0]) }
                    { messages.map((message, i) => (
                        <ChatMessage
                            key = { i }
                            message = { message }
                            timestamp = { formattedTS[i] }
                            showTimestamp = { showTSArray[i] } />
                    )) }
                </div>
            </div>
        );
    }
}

function _mapStateToProps(state, ownProps) {
    const participantID = ownProps.messages[0].id;
    const participant = getParticipantById(state, participantID);
    const localParticipant = getLocalParticipant(state);

    return {
        _isChatMessageDisabled: Boolean(participant?.role === 'visitor'),
        _isLocalParticipantAModerator: Boolean(localParticipant.role === 'moderator'),
        _isLocal: localParticipant.id === participantID,
        _participant: participant,
    };
}

export default translate(connect(_mapStateToProps)(ChatMessageGroup));
