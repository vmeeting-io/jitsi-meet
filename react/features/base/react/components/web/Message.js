import React, { Component, ReactNode } from 'react';
import { toArray } from 'react-emoji-render';

import { translate } from '../../../i18n/functions';
import Icon from '../../../icons/components/Icon';
import { 
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
} from '../../../icons/svg';
import { getBaseUrl, getFileSize, processFileSize, truncateDateTimeStamp } from '../../../util';

import Linkify from './Linkify';

/**
 * Renders the content of a chat message.
 */
class Message extends Component {
    /**
     * Initializes a new {@code Message} instance.
     *
     * @param {IProps} props - The props of the component.
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance
        this._processMessage = this._processMessage.bind(this);
        this._renderFileUploads = this._renderFileUploads.bind(this);
    }

    _renderFileUploads(msg, icon, fileName, fsize, index) {
        return (
            <a target="_blank" key = { `${msg}-${index}` } href={ msg } download={ fileName }>
                <div className = "userfiles">
                    <div className = "userfiles-icons">
                        <Icon src={ icon } size= { 50 } />
                    </div>
                    <div className = "userfilesnamesize">
                        <div className = "userfilesname">
                            { fileName }
                        </div>
                        <div className = "userfilessize">
                            { this.props.t('chat.filesize') + fsize }
                        </div>
                    </div>
                </div>
            </a>
        );
    }

    /**
     * Parses and builds the message tokens to include emojis and urls.
     *
     * @returns {Array<string|ReactElement>}
     */
    _processMessage() {
        let key = 1024;
        const { text } = this.props;
        const message: (string | ReactNode)[] = [];
        const downloadBaseURL = `${getBaseUrl()}download`;

        // Tokenize the text in order to avoid emoji substitution for URLs
        const tokens = text ? text.split(' ') : [];

        const content = [];

        function splitToken(token) {
            if (token.includes('://') || token.startsWith('@')) {
                // Bypass the emojification when urls or matrix ids are involved
                return [token];
            } else {
                return [...toArray(token, { className: 'smiley' })];
            }
        }

        for (const token of tokens) {
            if (token.includes('\n')) {
                for (const line of token.split('\n')) {
                    content.push(...splitToken(line));
                    content.push(React.createElement('br', { key }));
                    key += 1;
                }
            } else {
                content.push(...splitToken(token));
            }
            content.push(' ');
        }

        content.forEach((token, index) => {
            if (typeof token === 'string' && token.startsWith(downloadBaseURL)) {
                let filename = token.split('/').pop(); // use pop to fetch the last element contained in the array after using split
                if ((filename !== undefined) && (filename !== '')) {

                    const fsize = getFileSize(token);
                    const processedSize = processFileSize(fsize);
                    let decodedFileName = decodeURIComponent(filename);
                    let rawFileNameWOTS = truncateDateTimeStamp(decodedFileName);

                    // poetic way to check whether the file extension types
                    if(/\.(jpe?g|png|gif|bmp)$/i.test(token)) {
                        message.push(<a target="_blank" key = 'chatmessage-uploadedImage' href={ token } download={ rawFileNameWOTS }><img className = 'chatmessage-uploadedImage' key = { token } src = { token } /></a>);
                    }
                    else if(/\.(pdf)$/i.test(token)) {
                        message.push(this._renderFileUploads(token, IconSharePDF, rawFileNameWOTS, processedSize, index));
                    }
                    else if(/\.(ppt|pptx)$/i.test(token)) {
                        message.push(this._renderFileUploads(token, IconSharePPT, rawFileNameWOTS, processedSize, index));
                    }
                    else if(/\.(html|htm)$/i.test(token)) {
                        message.push(this._renderFileUploads(token, IconShareHTML, rawFileNameWOTS, processedSize, index));
                    }
                    else if(/\.(doc|docx)$/i.test(token)) {
                        message.push(this._renderFileUploads(token, IconShareWord, rawFileNameWOTS, processedSize, index));
                    }
                    else if(/\.(hwp)$/i.test(token)) {
                        message.push(this._renderFileUploads(token, IconShareHWP, rawFileNameWOTS, processedSize, index));
                    }
                    else if(/\.(xls|xlsx)$/i.test(token)) {
                        message.push(this._renderFileUploads(token, IconShareExcel, rawFileNameWOTS, processedSize, index));
                    }
                    else if(/\.(zip)$/i.test(token)) {
                        message.push(this._renderFileUploads(token, IconShareZip, rawFileNameWOTS, processedSize, index));
                    }
                    else if(/\.(mp3)$/i.test(token)) {
                        message.push(this._renderFileUploads(token, IconShareMP3, rawFileNameWOTS, processedSize, index));
                    }
                    else if(/\.(mp4)$/i.test(token)) {
                        message.push(this._renderFileUploads(token, IconShareMP4, rawFileNameWOTS, processedSize, index));
                    }
                    // else it is an uploaded file but we don't have corresponding icon, we use the base icon
                    else {
                        message.push(this._renderFileUploads(token, IconShareFile, rawFileNameWOTS, processedSize, index));
                    }
                // when someone is just sending a message with the URL of the server but nothing more
                } else {
                    message.push(token);
                }
            } else if (typeof token === 'string' && token !== ' ') {
                message.push(<Linkify key = { `${token}-${index}` }>{ token }</Linkify>);
            } else {
                message.push(token);
            }
        });

        return message;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @returns {ReactElement}
     */
    render() {
        return (
            <>
                { this._processMessage() }
            </>
        );
    }
}

export default translate(Message);
