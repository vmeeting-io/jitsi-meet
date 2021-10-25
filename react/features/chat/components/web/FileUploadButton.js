/* @flow */

import React, { Component } from 'react';
import axios from 'axios';
import { getAuthUrl } from '../../../../api/url';
import { showToast } from '../../../../features/notifications';
import { getConferenceName } from '../../../base/conference';
import { translate } from '../../../base/i18n';
import { Icon, IconPaperClip } from '../../../base/icons';
import { Tooltip } from '../../../base/tooltip';
import { getBaseUrl } from '../../../base/util';
import { sendMessage } from '../../actions';

const NOTIFICATION_TIMEOUT = 3000;

const MAX_FILE_SIZE_FOR_UPLOAD = 314572800; // 300 MB = 300 X 1024 X 1024 bytes

/**
 * The type of the React {@code Component} props of {@code AbstractChat}.
 */
export type Props = {
    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
};


/**
 * Implements a React {@link Component} which displays a button for uploading a file in a chatroom
 *
 */
class FileUploadButton<P: Props> extends Component {
    /**
     * Instantiates a new {@code Component}.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);
        this.uploadFile = this.uploadFile.bind(this);
    }

    state = {
        // initially no file is selected
        selectedFile: null,
        fileUploaded: Boolean,
        uploadedURL: String,
        conferenceName: String,
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t, visible } = this.props;

        if (!visible) {
            return null;
        }

        return (
            <Tooltip
                content = { t('fileupload.title') }
                position = 'top'>
                <div className = 'file-upload'>
                    <div id='fileuploadarea'>
                        <Icon src = { IconPaperClip } onClick = { () => this.refs.fileInput.click() }/>
                        <input
                            type='file'
                            ref= 'fileInput'
                            onChange = {e => this.uploadFile(e.target.files[0])}  // we will only select a single file for the time being
                            className = 'file-upload-btn' 
                        />
                    </div>
                </div>
            </Tooltip>
        );
    }

    uploadFile: (file) => void

    async uploadFile(file) {
        await this.setState({ selectedFile: file });
        const { t } = this.props;

        if(file.size > MAX_FILE_SIZE_FOR_UPLOAD) {
            alert(t('fileupload.maxfilesizeexceeded'));
            return;
        }

        let _apiBase = getAuthUrl(APP.store.getState());

        const serverURL = getBaseUrl();
        const dispatch = APP.store.dispatch;
        const formData = new FormData();

        const roomName =  getConferenceName(APP.store.getState()).replace(/\s+/g, '').toLowerCase() // strip all spaces and case convert to lowercase
        
        // update the formdata object
        formData.append(file.name, file);

        // attach the roomName to the file upload button
        formData.append('roomName', roomName);

        // code to send to vmapi
        try {
            const resp = await axios.post(`${_apiBase}/uploads`, formData);


            if(resp.status === 200) {
                // the URL of the server should be adjusted accordingly

                // we use encodeURIComponent to ensure that spaces and special characters in filename is well-replaced to represent a URL
                const newFileUrl = `${serverURL}/download/files/${roomName}/${encodeURIComponent(resp.data.fileName)}`;
                this.setState({ uploadedURL: newFileUrl, fileUploaded: true, conferenceName: roomName });
                
                // dispatch sendMessage action to display the URL of the uploaded file as a message
                dispatch(sendMessage(newFileUrl));
            }
            
        } catch(err) {
            // show a toast error message in case of file upload error
            showToast({
                title: t('fileupload.error'), // need to use translated strings here
                timeout: NOTIFICATION_TIMEOUT,
                icon: 'error',
                animation: false });
        }


    }
}

export default translate(FileUploadButton);
