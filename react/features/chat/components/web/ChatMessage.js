// @flow

import DropdownMenu, { DropdownItem, DropdownItemGroup } from '@atlaskit/dropdown-menu';
import React from 'react';
import { toArray } from 'react-emoji-render';
import { 
    Icon,
    IconMenuThumb,
    IconShareDoc,
    IconShareExcel,
    IconShareHTML,
    IconShareMP3,
    IconShareMP4,
    IconSharePDF,
    IconShareWord,
    IconShareZip
} from '../../../base/icons';
import { translate } from '../../../base/i18n';
import { Linkify } from '../../../base/react';
import { connect } from '../../../base/redux';
import { MESSAGE_TYPE_LOCAL } from '../../constants';
import { getBaseUrl } from '../../../base/util';
// import BanRemoteParticipantDialog from '../../../video-menu/components/web/BanRemoteParticipantDialog';
import KickRemoteParticipantDialog from '../../../video-menu/components/web/KickRemoteParticipantDialog';

import AbstractChatMessage, {
    type Props
} from '../AbstractChatMessage';
import PrivateMessageButton from '../PrivateMessageButton';
import { getLocalParticipant, getParticipantById, getParticipants } from '../../../base/participants';

import { openDialog } from '../../../base/dialog';
import EnableChatForRemoteParticipantDialog from '../../../video-menu/components/web/EnableChatForRemoteParticipantDialog';
import DisableChatForRemoteParticipantDialog from '../../../video-menu/components/web/DisableChatForRemoteParticipantDialog';
import { setPrivateMessageRecipient } from '../../actions';
import PrivateNotice from './PrivateNotice';

declare var APP: Object;

/**
 * Renders a single chat message.
 */
class ChatMessage extends AbstractChatMessage<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */

    constructor(props) {
        super(props);

        this._onToggleChatState = this._onToggleChatState.bind(this);
        this._onKickUser = this._onKickUser.bind(this);
        this._onPrivateMessage = this._onPrivateMessage.bind(this);
    }

    render() {
        const { message, t } = this.props;
        const processedMessage = [];

        const txt = this._getMessageText();

        // Tokenize the text in order to avoid emoji substitution for URLs.
        const tokens = txt.split(' ');

        // Content is an array of text and emoji components
        const content = [];

        for (const token of tokens) {
            if (token.includes('://')) {
                // It contains a link, bypass the emojification.
                content.push(token);
            } else {
                content.push(...toArray(token, { className: 'smiley' }));
            }

            content.push(' ');
        }

        content.forEach(msg => {
            if(typeof msg === 'string' && msg.startsWith(getBaseUrl())) {
                let filename = msg.split('id=')[1];
                // poetic way to check whether the file extension types
                if(/\.(jpe?g|png|gif|bmp)$/i.test(msg) && (filename !== undefined) && (filename !== '')) {
                    processedMessage.push(<a target="_blank" href={ msg }><img className = 'chatmessage-uploadedImage' key = {msg } src = { msg } /></a>);
                }
                else if(/\.(pdf)$/i.test(msg) && (filename !== undefined) && (filename !== '')) {
                    processedMessage.push(<a target="_blank" href={ msg }><Linkify key = { msg }> <Icon src={ IconSharePDF } size= { 60 } /> { filename }</Linkify></a>);
                }
                else if(/\.(html|htm)$/i.test(msg) && (filename !== undefined) && (filename !== '')) {
                    processedMessage.push(<a target="_blank" href={ msg }><Linkify key = { msg }> <Icon src={ IconShareHTML } size= { 60 } /> { filename }</Linkify></a>);
                }
                else if(/\.(doc|docx|hwp)$/i.test(msg) && (filename !== undefined) && (filename !== '')) {
                    processedMessage.push(<a target="_blank" href={ msg }><Linkify key = { msg }> <Icon src={ IconShareWord } size= { 60 } /> { filename }</Linkify></a>);
                }
                else if(/\.(xls|xlsx)$/i.test(msg) && (filename !== undefined) && (filename !== '')) {
                    processedMessage.push(<a target="_blank" href={ msg }><Linkify key = { msg }> <Icon src={ IconShareExcel } size= { 60 } /> { filename }</Linkify></a>);
                }
                else if(/\.(zip)$/i.test(msg) && (filename !== undefined) && (filename !== '')) {
                    processedMessage.push(<a target="_blank" href={ msg }><Linkify key = { msg }> <Icon src={ IconShareZip } size= { 60 } /> { filename }</Linkify></a>);
                }
                else if(/\.(mp3)$/i.test(msg) && (filename !== undefined) && (filename !== '')) {
                    processedMessage.push(<a target="_blank" href={ msg }><Linkify key = { msg }> <Icon src={ IconShareMP3 } size= { 60 } /> { filename }</Linkify></a>);
                }
                else if(/\.(mp4)$/i.test(msg) && (filename !== undefined) && (filename !== '')) {
                    processedMessage.push(<a target="_blank" href={ msg }><Linkify key = { msg }> <Icon src={ IconShareMP4 } size= { 60 } /> { filename }</Linkify></a>);
                }

                // else it is an uploaded file but we don't have corresponding icon, we use the base icon
                else {
                    processedMessage.push(<a target="_blank" href={ msg }><Linkify key = { msg }> <Icon src={ IconShareDoc } size= { 60 } /> { filename }</Linkify></a>);
                }

            }
            else if (typeof msg === 'string' && msg !== ' ') {
                processedMessage.push(<Linkify key = { msg }>{ msg }</Linkify>);
            }
            else {
                processedMessage.push(msg);
            }
        });
        return (
            <div
                className = {`chatmessage-wrapper ${message.messageType}`}
                tabIndex = { -1 }>
                <div className = { `chatmessage ${message.privateMessage ? 'privatemessage' : ''}` }>
                    <div className = 'replywrapper'>
                        <div className = 'messagecontent'>
                            { this.props.showDisplayName && this._renderDisplayName() }
                            <div className = 'usermessage'>
                                { processedMessage }
                            </div>
                            { message.privateMessage && <PrivateNotice message= { message } t = { t } /> }
                        </div>
                        { message.privateMessage && message.messageType !== MESSAGE_TYPE_LOCAL
                            && (
                                <div className = 'messageactions'>
                                    <PrivateMessageButton
                                        participantID = { message.id }
                                        reply = { true }
                                        showLabel = { false } />
                                </div>
                            ) }
                    </div>
                </div>
                { this.props.showTimestamp && this._renderTimestamp() }
            </div>
        );
    }

    _getFormattedTimestamp: () => string;

    _getMessageText: () => string;

    _getPrivateNoticeMessage: () => string;

    _onKickUser: () => void;

    _onKickUser() {
        const { dispatch, message } = this.props;
        dispatch(openDialog(KickRemoteParticipantDialog, { participantID: message.id }));
    }

    _onPrivateMessage: () => void;

    _onPrivateMessage() {
        const { dispatch, _participant } = this.props;
        dispatch(setPrivateMessageRecipient(_participant));
    }

    _onToggleChatState: () => void;

    _onToggleChatState() {
        const { _isChatMessageDisabled, dispatch, message } = this.props;
        
        // get the participantID for whom the action is to be dispatched
        const participantID = message.id;

        //let predefinedRole = getParticipantById(APP.store.getState(), participantID).role;

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
    _renderDisplayName() {
        return (
            <div
                aria-hidden = { true }
                className = 'display-name'>
                { this.props.message.displayName }
                { this._renderUserControlIcon() }
            </div>
        );
    }

    /**
     * Render control button on the sender's name on the chat history section
     * 
     * @returns {Icon} 
     */
    _renderUserControlIcon = () => {
        const { _isChatMessageDisabled, _participant, t } = this.props;

        const localParticipant = getLocalParticipant(APP.store.getState());  
        let isLocalParticipantAModerator = (localParticipant.role === "moderator");
        
        //we want to only allow moderators to get the chat control button alongside chat message
        if (isLocalParticipantAModerator && _participant) {
            return(
                <div className = 'message-menu-container'>
                    <DropdownMenu
                        boundariesElement = 'scrollParent'
                        triggerButtonProps = {{ iconBefore: <Icon size = { 16 } src = { IconMenuThumb } /> }}
                        triggerType = 'button'>
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
                </div>
            );
        } else {
            return null;
        }

    }

    /**
     * Renders the message privacy notice.
     *
     * @returns {React$Element<*>}
     */
    _renderPrivateNotice() {
        return (
            <div className = 'privatemessagenotice'>
                { this._getPrivateNoticeMessage() }
            </div>
        );
    }

    /**
     * Renders the time at which the message was sent.
     *
     * @returns {React$Element<*>}
     */
    _renderTimestamp() {
        const { timestamp } = this.props;
        return (
            <div className = 'timestamp'>
                {/* { this._getFormattedTimestamp() } */}
                { timestamp }
            </div>
        );
    }
}

function _mapStateToProps(state, ownProps) {
    const participantID = ownProps.message.id;
    const participant = getParticipantById(state, participantID);
    const userRole = participant?.role;

    return {
        _isChatMessageDisabled: Boolean(userRole === "visitor"),
        _participant: participant,
    };
}

export default translate(connect(_mapStateToProps)(ChatMessage));
