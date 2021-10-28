// @flow

import DropdownMenu, { DropdownItem, DropdownItemGroup } from '@atlaskit/dropdown-menu';
import React from 'react';
import { toArray } from 'react-emoji-render';
import { 
    Icon,
    IconMenuThumb,
    IconShareExcel,
    IconShareHTML,
    IconShareHWP,
    IconShareFile,
    IconShareMP3,
    IconShareMP4,
    IconSharePDF,
    IconSharePPT,
    IconShareWord,
    IconShareZip
} from '../../../base/icons';
import { translate } from '../../../base/i18n';
import { Linkify } from '../../../base/react';
import { connect } from '../../../base/redux';
import { MESSAGE_TYPE_LOCAL } from '../../constants';
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
import { getBaseUrl, getFileSize, processFileSize, truncateDateTimeStamp } from '../../../base/util';

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

        const serverURL = getBaseUrl();

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

            if(typeof msg === 'string' && msg.startsWith(serverURL)) {
                let filename = msg.split('/').pop(); // use pop to fetch the last element contained in the array after using split
                if((filename !== undefined) && (filename !== '')) {

                    const fsize = getFileSize(msg);
                    const processedSize = processFileSize(fsize);
                    let decodedFileName = decodeURIComponent(filename);
                    let rawFileNameWOTS = truncateDateTimeStamp(decodedFileName);

                    // poetic way to check whether the file extension types
                    if(/\.(jpe?g|png|gif|bmp)$/i.test(msg)) {
                        processedMessage.push(<a target="_blank" key = 'chatmessage-uploadedImage' href={ msg } download={ rawFileNameWOTS }><img className = 'chatmessage-uploadedImage' key = { msg } src = { msg } /></a>);
                    }
                    else if(/\.(pdf)$/i.test(msg) && (filename !== undefined) && (filename !== '')) {
                        processedMessage.push(this._renderFileUploads(msg, IconSharePDF, rawFileNameWOTS, processedSize));
                    }
                    else if(/\.(ppt|pptx)$/i.test(msg) && (filename !== undefined) && (filename !== '')) {
                        processedMessage.push(this._renderFileUploads(msg, IconSharePPT, rawFileNameWOTS, processedSize));
                    }
                    else if(/\.(html|htm)$/i.test(msg) && (filename !== undefined) && (filename !== '')) {
                        processedMessage.push(this._renderFileUploads(msg, IconShareHTML, rawFileNameWOTS, processedSize));
                    }
                    else if(/\.(doc|docx)$/i.test(msg) && (filename !== undefined) && (filename !== '')) {
                        processedMessage.push(this._renderFileUploads(msg, IconShareWord, rawFileNameWOTS, processedSize));
                    }
                    else if(/\.(hwp)$/i.test(msg) && (filename !== undefined) && (filename !== '')) {
                        processedMessage.push(this._renderFileUploads(msg, IconShareHWP, rawFileNameWOTS, processedSize));
                    }
                    else if(/\.(xls|xlsx)$/i.test(msg) && (filename !== undefined) && (filename !== '')) {
                        processedMessage.push(this._renderFileUploads(msg, IconShareExcel, rawFileNameWOTS, processedSize));
                    }
                    else if(/\.(zip)$/i.test(msg) && (filename !== undefined) && (filename !== '')) {
                        processedMessage.push(this._renderFileUploads(msg, IconShareZip, rawFileNameWOTS, processedSize));
                    }
                    else if(/\.(mp3)$/i.test(msg) && (filename !== undefined) && (filename !== '')) {
                        processedMessage.push(this._renderFileUploads(msg, IconShareMP3, rawFileNameWOTS, processedSize));
                    }
                    else if(/\.(mp4)$/i.test(msg) && (filename !== undefined) && (filename !== '')) {
                        processedMessage.push(this._renderFileUploads(msg, IconShareMP4, rawFileNameWOTS, processedSize));
                    }
                    // else it is an uploaded file but we don't have corresponding icon, we use the base icon
                    else {
                        processedMessage.push(this._renderFileUploads(msg, IconShareFile, rawFileNameWOTS, processedSize));
                    }
                // when someone is just sending a message with the URL of the server but nothing more
                } else {
                    processedMessage.push(msg);
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

    _renderFileUploads(msg, icon, fileName, fsize) {
        const { t } = this.props;
        return(
            <a target="_blank" key = { msg } href={ msg } download={ fileName }>
                <div className = "userfiles">
                    <div className = "userfiles-icons">
                        <Icon src={ icon } size= { 50 } />
                    </div>
                    <div className = "userfilesnamesize">
                        <div className = "userfilesname">
                            { fileName }
                        </div>
                        <div className = "userfilessize">
                            { t('chat.filesize') + fsize }
                        </div>
                    </div>
                </div>
            </a>
        );
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
