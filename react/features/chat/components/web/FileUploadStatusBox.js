/* @flow */

import React, { Component } from 'react';
import { translate } from '../../../base/i18n';
import { Circle } from 'rc-progress';

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
 * Implements a React {@link Component} which displays the status of a file being uploaded
 *
 */
class FileUploadStatusBox<P: Props> extends Component {
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
        const { t, fileUploadPercentage, fileName, fileSize } = this.props;

        return (
            <div id='file-upload-status-box' className='chat-file-upload-status-box'>
                {/* render circular progress bar here */}
                <div className=''>
                    <Circle percent={ fileUploadPercentage } strokeWidth="4" strokeColor="#FF0000" />
                </div>

                {/* render filename and size info here */}
                <div className=''>
                    <p> { fileName } </p>
                    <p> { fileSize } </p>
                </div>
            </div>
        );
    }
}

export default translate(FileUploadStatusBox);
