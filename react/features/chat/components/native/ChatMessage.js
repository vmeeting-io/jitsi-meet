// @flow

import React from 'react';
import { Text, View, Button, Image,Linking,TouchableHighlight} from 'react-native';

import { Avatar } from '../../../base/avatar';
import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { translate } from '../../../base/i18n';
import { Linkify } from '../../../base/react';
import { connect } from '../../../base/redux';
import { type StyleType } from '../../../base/styles';
import { MESSAGE_TYPE_ERROR, MESSAGE_TYPE_LOCAL } from '../../constants';
import { replaceNonUnicodeEmojis } from '../../functions';
import AbstractChatMessage, { type Props as AbstractProps } from '../AbstractChatMessage';
import PrivateMessageButton from '../PrivateMessageButton';
import { Icon, IconDocDOC, IconDocHTML, IconDocHWP, IconDocJPEG, IconDocMP3, IconDocMP4, IconDocPDF, IconDocXLS, IconDocZIP, IconDocGENERAL} from '../../../base/icons';
import { getBaseUrl, getFileSize, processFileSize, validURL} from '../../../base/util';
import { getServerURL } from '../../../base/settings';

import styles from './styles';
import RNFetchBlob from 'rn-fetch-blob';

type Props = AbstractProps & {

    /**
     * The color-schemed stylesheet of the feature.
     */
    _styles: StyleType
};

/**
 * Renders a single chat message.
 */
class ChatMessage extends AbstractChatMessage<Props> {
    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _styles, message, _serverURL } = this.props;
        const localMessage = message.messageType === MESSAGE_TYPE_LOCAL;
        const { privateMessage } = message;
        const serverURL = _serverURL;

        // Style arrays that need to be updated in various scenarios, such as
        // error messages or others.
        const detailsWrapperStyle = [
            styles.detailsWrapper
        ];
        const messageBubbleStyle = [
            styles.messageBubble
        ];

        if (localMessage) {
            // This is a message sent by the local participant.

            // The wrapper needs to be aligned to the right.
            detailsWrapperStyle.push(styles.ownMessageDetailsWrapper);

            // The bubble needs some additional styling
            messageBubbleStyle.push(_styles.localMessageBubble);
        } else if (message.messageType === MESSAGE_TYPE_ERROR) {
            // This is a system message.

            // The bubble needs some additional styling
            messageBubbleStyle.push(styles.systemMessageBubble);
        } else {
            // This is a remote message sent by a remote participant.

            // The bubble needs some additional styling
            messageBubbleStyle.push(_styles.remoteMessageBubble);
        }

        if (privateMessage) {
            messageBubbleStyle.push(_styles.privateMessageBubble);
        }

        return (
            <View style = { styles.messageWrapper } >
                { this._renderAvatar() }
                <View style = { detailsWrapperStyle }>
                    <View style = { messageBubbleStyle }>
                        <View style = { styles.textWrapper } >
                            { this._renderDisplayName() }
                            
                            { this._renderFileMessage(serverURL) }
                               
                            { this._renderPrivateNotice() }
                        </View>
                        { this._renderPrivateReplyButton() }
                    </View>
                    { this._renderTimestamp() }
                </View>
            </View>
        );
    }

    _truncateDateTimeStamp(filename){
        // Remove datetime stamp appended at the end of the file.
        const x = filename.lastIndexOf('_')
        const y = filename.lastIndexOf('.')
        return filename.substring(0,x) + filename.substring(y,filename.length);
    }
    _getShortName(filename){
        const len = filename.length;
        if(len>25){
            return filename.substring(0,16) + "..." + filename.substring(len-8,len);
        }
        return filename;
    }

    _renderFileMessage(serverURL){    
        let msg = this._getMessageText();  
        let iconToDisplay = null;
        let filename = null;
        let processedSize = null;
        // msg = decodeURIComponent(msg);
        let image = false;

        if(typeof msg === 'string' && msg.startsWith(serverURL)) {
            const filelink = msg;
            filename = filelink.split('/').pop(); // use pop to fetch the last element contained in the array after using split
            filename = decodeURIComponent(filename);
            
            filename = this._truncateDateTimeStamp(filename);
            filename = this._getShortName(filename);

            processedSize = processFileSize((Math.random() * (900024 - 1) + 1).toFixed(4));//TODO: Dummy file size for UI only.
            if((filename !== undefined) && (filename !== '')) {

                // const processedSize = processFileSize(size); // TODO-: Filesize

                // poetic way to check whether the file extension types
                if(/\.(jpe?g|png|gif|bmp)$/i.test(filelink)) {
                    image=true;
                }
                else if(/\.(pdf)$/i.test(filelink) && (filename !== undefined) && (filename !== '')) {
                    iconToDisplay = IconDocPDF;
                }
                else if(/\.(html|htm)$/i.test(filelink) && (filename !== undefined) && (filename !== '')) {
                    iconToDisplay = IconDocHTML;
                }
                else if(/\.(hwp)$/i.test(filelink) && (filename !== undefined) && (filename !== '')) {
                    iconToDisplay = IconDocHWP;
                }
                else if(/\.(doc|docx|hwp)$/i.test(filelink) && (filename !== undefined) && (filename !== '')) {
                    iconToDisplay = IconDocDOC;
                }
                else if(/\.(xls|xlsx)$/i.test(filelink) && (filename !== undefined) && (filename !== '')) {
                    iconToDisplay = IconDocXLS;
                }
                else if(/\.(zip)$/i.test(filelink) && (filename !== undefined) && (filename !== '')) {
                    iconToDisplay = IconDocZIP;
                }
                else if(/\.(mp3)$/i.test(filelink) && (filename !== undefined) && (filename !== '')) {
                    iconToDisplay = IconDocMP3;
                }
                else if(/\.(mp4)$/i.test(filelink) && (filename !== undefined) && (filename !== '')) {
                    iconToDisplay = IconDocMP4;
                }
                // else it is an uploaded file but we don't have corresponding icon, we use the base icon
                else {
                    iconToDisplay = IconDocGENERAL;
                }
            } 
        }

        return(
            <View>
            {/* If Image display preview of image. */}
            {image && <View>
            <TouchableHighlight
                  onPress={() => this._onClickFile(msg)}>
                <Image
                    style={styles.chatmessageUploadedImage}
                    source={{uri:msg}}
                />    
            </TouchableHighlight>    

            </View>}
            
            {/* If file being sent is not an image, show as icon */}
            {!image && <TouchableHighlight
                  onPress={() => this._onClickFile(msg)}>
                    <View>
                        {/* For Text Messages */}
                       { !iconToDisplay && <Linkify linkStyle = { styles.chatLink }>
                            { !iconToDisplay && replaceNonUnicodeEmojis(this._getMessageText()) }  
                        </Linkify>}
                        
                        { iconToDisplay && <View style={[styles.fileContainer, {
                                flexDirection: "row"
                                }]}>

                                <View style={styles.fileIconInisdeContainer} >
                                    { iconToDisplay && <Icon
                                        src = { iconToDisplay }
                                        style = { styles.fileShareIcon } /> }
                                </View>
                                
                                <View style={styles.fileDetailInisdeContainer } >
                                    <View style={{
                                            flexDirection: "column"
                                    }}>
                                        <View style={styles.fileNameContainer} > 
                                            {/* <Text style={styles.fileName}>01 FileName_File Detail Work_Place_Dummy.txt</Text> */}
                                            {/* <Text style={styles.fileName}>01 ABC 기술이전화 사업계획서_최종버전.pdf</Text> */}
                                            {/* <Text style={styles.fileName}>ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456.pdf</Text> */}
                                            <Text>{filename}</Text>
                                        </View>
                                        <View style={ styles.fileSizeContainer } >
                                            <Text style={ styles.fileSize }>Size : {processedSize} </Text>
                                        </View>
                                    </View>        
                                </View>
                        </View>}
                    </View>
                </TouchableHighlight>}
            </View>
        )
    }

    _getFormattedTimestamp: () => string;

    _getMessageText: () => string;

    _getPrivateNoticeMessage: () => string;

    _onClickFile(url){
        console.log("vmchg: 1: On avatar Click!!");

        const { config, fs } = RNFetchBlob
        let PictureDir = fs.dirs.PictureDir // this is the pictures directory. You can check the available directories in the wiki.
        let options = {
        fileCache: true,
        addAndroidDownloads : {
            useDownloadManager : true, // setting it to true will use the device's native download manager and will be shown in the notification bar.
            notification : false,
            path:  PictureDir + "/me_", // this is the path where your downloaded file will live in
            description : 'Downloading image.'
        }
        }
        config(options).fetch('GET', url).then((res) => {
        // do some magic here
            console.log('vmchg: 1: ', res.info())
            if (Platform.OS === 'android') {
                RNFetchBlob.android.actionViewIntent(res.path(), 'image/png');
              }
        
              if (Platform.OS === 'ios') {
                RNFetchBlob.ios.openDocument(res.path());
              }
        })

        
        // RNFetchBlob
        //     .config({
        //         // add this option that makes response data to be stored as a file,
        //         // this is much more performant.
        //             fileCache : true,
        //             title: "abc.pdf",
        //             appendExt : 'tmp'
        //             }
        //         )
        //     .fetch('GET', url, {
        //         //some headers ..
        //     })
        //     .then((res) => {
        //         // the temp file path
        //         console.log('vmchg: 1.2.1: The file saved to ', res.path())

        //         if (Platform.OS === 'android') {
        //             RNFetchBlob.android.actionViewIntent(res.path(), mimeType || 'application/pdf');
        //           }
            
        //           if (Platform.OS === 'ios') {
        //             RNFetchBlob.ios.previewDocument(res.path());
        //           }

        //         console.log('vmchg: 1.2.3: The file saved to ', res)
        //     });
        
        console.log("vmchg: 2: On avatar Click Complete!!");
    }

    /**
     * Renders the avatar of the sender.
     *
     * @returns {React$Element<*>}
     */
    _renderAvatar() {
        const { message } = this.props;

        return (
            <View style = { styles.avatarWrapper }>
                { this.props.showAvatar && <Avatar
                    displayName = { message.displayName }
                    participantId = { message.id }
                    size = { styles.avatarWrapper.width } />
                }
            </View>
        );
    }

    /**
     * Renders the display name of the sender if necessary.
     *
     * @returns {React$Element<*> | null}
     */
    _renderDisplayName() {
        const { _styles, message, showDisplayName } = this.props;

        if (!showDisplayName) {
            return null;
        }

        return (
            <Text style = { _styles.displayName }>
                { message.displayName }
            </Text>
        );
    }

    /**
     * Renders the message privacy notice, if necessary.
     *
     * @returns {React$Element<*> | null}
     */
    _renderPrivateNotice() {
        const { _styles, message } = this.props;

        if (!message.privateMessage) {
            return null;
        }

        return (
            <Text style = { _styles.privateNotice }>
                { this._getPrivateNoticeMessage() }
            </Text>
        );
    }

    /**
     * Renders the private reply button, if necessary.
     *
     * @returns {React$Element<*> | null}
     */
    _renderPrivateReplyButton() {
        const { _styles, message } = this.props;
        const { messageType, privateMessage } = message;

        if (!privateMessage || messageType === MESSAGE_TYPE_LOCAL) {
            return null;
        }

        return (
            <View style = { _styles.replyContainer }>
                <PrivateMessageButton
                    participantID = { message.id }
                    reply = { true }
                    showLabel = { false }
                    toggledStyles = { _styles.replyStyles } />
            </View>
        );
    }

    /**
     * Renders the time at which the message was sent, if necessary.
     *
     * @returns {React$Element<*> | null}
     */
    _renderTimestamp() {
        if (!this.props.showTimestamp) {
            return null;
        }

        return (
            <Text style = { styles.timeText }>
                { this._getFormattedTimestamp() }
            </Text>
        );
    }
}

/**
 * Maps part of the redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        _styles: ColorSchemeRegistry.get(state, 'Chat'),
        _serverURL: state['features/base/settings'].serverURL
    };
}

export default translate(connect(_mapStateToProps)(ChatMessage));
