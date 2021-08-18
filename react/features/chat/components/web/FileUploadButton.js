/* @flow */

import React, {Component} from 'react';
import axios from 'axios';
import { Icon, IconShareDoc } from '../../../base/icons';
import { getAuthUrl } from '../../../../api/url';
import { getBaseUrl } from '../../../base/util';
import { sendMessage } from '../../actions';
import { getConferenceName } from '../../../base/conference';
import { showToast } from '../../../../features/notifications';

declare var interfaceConfig: Object;

const NOTIFICATION_TIMEOUT = 3000;

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
export class FileUploadButton<P: Props> extends Component {
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
        const { visible } = this.props;

        if (!visible) {
            return null;
        }

        return (
            <div className = 'file-upload'>
                <div id='fileuploadarea'>
                    <Icon src = { IconShareDoc } onClick = { () => this.refs.fileInput.click() }/>
                    <input
                        type='file'
                        ref= 'fileInput'
                        onChange = {e => this.uploadFile(e.target.files[0])}  // we will only select a single file for the time being
                        className = 'file-upload-btn' 
                    />
                </div>
            </div>
        );
    }

    uploadFile: (file) => void

    async uploadFile(file) {
        await this.setState({ selectedFile: file });
        console.log("Inside uploadFile");

        let _apiBase = getAuthUrl(APP.store.getState());
        console.log("_apiBase is: ", _apiBase);
        const dispatch = APP.store.dispatch;
        const formData = new FormData();

        const roomName =  getConferenceName(APP.store.getState()).replace(/\s+/g, '') // strip all spaces
        console.log("Roomname is: ", roomName);
        
        // update the formdata object
        formData.append(file.name, file);
        console.log("FormData is: ", formData);

        // attach the roomName to the file upload button
        formData.append('roomName', roomName);
        console.log("Form Data is: ", formData);

        // code to send to vmapi
        try {
            const resp = await axios.post(`${_apiBase}/uploads`, formData);

            console.log("Response data is: ", resp);

            if(resp.status === 200) {
                // the URL of the server should be adjusted accordingly
                const fileUrl = `https://141.223.82.233:8443/auth/api/uploads/?id=${resp.data.fileName}&roomName=${roomName}`;
                console.log("Uploaded file URL is: ", fileUrl);
                this.setState({ uploadedURL: fileUrl, fileUploaded: true, conferenceName: roomName });

                // dispatch sendMessage action to display the URL of the uploaded file as a message
                dispatch(sendMessage(fileUrl));
            }
            
        } catch(err) {
            // show a toast error message asking for user to ensure themselves as a registered user
            showToast({
                title: 'Please ensure you are logged in to share a file', // need to use translated strings here
                timeout: NOTIFICATION_TIMEOUT,
                icon: 'error',
                animation: false });
        }


    }
}