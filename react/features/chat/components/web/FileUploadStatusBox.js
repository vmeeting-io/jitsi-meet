/* @flow */

import React, { Component } from 'react';
import moment from 'moment';

import { translate } from '../../../base/i18n';
import { Linkify } from '../../../base/react';
import { processFileSize } from '../../../base/util';
import Progress from '../../../../components/Progress';

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
            <div className = {'chat-message-group local'}>
                <div className = {'chatmessage-wrapper local'} tabIndex = { -1 }>
                    <div className = 'chatmessage'>
                        <div className = 'replywrapper'>
                            <div className = 'messagecontent'>
                                <div className = 'usermessage loadingCircleHeight'>
                                    <a target="_blank" href='#' >
                                        <Linkify key = { fileSize }>
                                            <div className = "userfiles">
                                                <div className = "userfiles-icons">
                                                    <Progress
                                                        type = 'circle'
                                                        percent = { fileUploadPercentage }
                                                        strokeColor = "#36c6f4"
                                                        className = "progressIcon"
                                                        width = { 50 } />
                                                </div>
                                                <div className = "userfilesnamesize">
                                                    <div className = "userfilesname ">
                                                        { fileName }
                                                    </div>
                                                    <div className = "userfilessize">
                                                        { t('chat.filesize') + processFileSize(fileSize) }
                                                    </div>
                                                </div>
                                            </div>
                                        </Linkify>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    { this._renderTimestamp() }
                </div>
            </div>

        );
    }

    _renderTimestamp() {
        const currentTime = moment().format('hh:mm');
        return (
            <div className = 'timestamp'>
                { currentTime }
            </div>
        );
    }
}

export default translate(FileUploadStatusBox);
