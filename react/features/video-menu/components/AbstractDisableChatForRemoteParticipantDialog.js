// @flow

import { Component } from 'react';

import { disableChatForParticipant } from '../../base/participants';
declare var APP: Object;
type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The ID of the remote participant to be disabled for chat.
     */
    participantID: string,

    /**
     * Function to translate i18n labels.
     */
    t: Function
};

/**
 * Abstract dialog to confirm a remote participant kick action.
 */
export default class AbstractDisableChatForRemoteParticipantDialog
    extends Component<Props> {
    /**
     * Initializes a new {@code AbstractDisableChatForRemoteParticipantDialog} instance.
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
        const { dispatch, participantID } = this.props;

        dispatch(disableChatForParticipant(participantID));

        return true;
    }
}
