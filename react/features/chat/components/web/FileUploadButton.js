/* @flow */

import React, { Component } from 'react';
import { translate } from '../../../base/i18n';
import { Icon, IconPaperClip } from '../../../base/icons';
import { Tooltip } from '../../../base/tooltip';
import { uploadFile } from '../../functions';


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
    }


    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t, visible } = this.props;
        const store = APP.store;
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
                            onChange = {e => uploadFile(e.target.files[0], store)}  // we will only select a single file for the time being
                            className = 'file-upload-btn' 
                        />
                    </div>
                </div>
            </Tooltip>
        );
    }

}

export default translate(FileUploadButton);
