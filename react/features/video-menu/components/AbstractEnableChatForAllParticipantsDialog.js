// @flow

import { Component } from 'react';
import { enableChatForAll } from '../../base/participants';

type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * Not sure if the participant ID will be of use in enabling all participants
     */
    participantID: string,

    /**
     * Function to translate i18n labels.
     */
    t: Function
};

/**
 * Abstract dialog to confirm enabling chat for all participants in a chatroom
 */
export default class AbstractEnableChatForAllParticipantsDialog
    extends Component<Props> {
    /**
     * Initializes a new {@code AbstractEnableChatForAllParticipantsDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onSubmit = this._onSubmit.bind(this);
    }

    _onSubmit: () => boolean;

    /**
     * Callback for the confirm button.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        const { dispatch } = this.props;

        // we will dispatch an event for all participants
        // need to amend it here.
        
        dispatch(enableChatForAll());

        return true;
    }
}
