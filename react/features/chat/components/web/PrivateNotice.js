import React, { Component } from 'react';
import { MESSAGE_TYPE_LOCAL } from '../../constants';
declare var APP: Object;

/**
 * The type of the React {@code Component} state of {@code PrivateNotice}.
 */

/**
 * The type of the React {@code Component} props of {@code PrivateNotice}.
 */
type Props = {
    /**
     * The representation of a chat message.
     */
    message: Object,

    /**
     * Name of the participant entitled to receive a private message
     */
    privateMessageRecipient: String,
};

export default class PrivateNotice extends Component<Props, State> {
    constructor(props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._getPrivateNoticeMessage = this._getPrivateNoticeMessage.bind(this);
    }

    render() {
        return(
            <div className = 'privatemessagenotice'>
                { this._getPrivateNoticeMessage() }
            </div>
        )
    }

    _getPrivateNoticeMessage: () => String;

    _getPrivateNoticeMessage = () => {
        const { message, t } = this.props;
        console.log("Inside _getPrivateNoticeMessage");
        console.log("this props are: ", this.props);
        
        return t('chat.privateNotice', {
            recipient: message.messageType === MESSAGE_TYPE_LOCAL ? message.recipient : t('me')
        });
    }

    
}




