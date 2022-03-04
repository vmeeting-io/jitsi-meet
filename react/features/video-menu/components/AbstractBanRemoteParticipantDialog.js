// @flow

import { Component } from 'react';
import { kickParticipant } from '../../base/participants';

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
export default class AbstractBanRemoteParticipantDialog
    extends Component<Props> {
    /**
     * Initializes a new {@code AbstractEnableChatForRemoteParticipantDialog} instance.
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
        // right now kick out this participant for the time being, modify later to ban this user
        dispatch(kickParticipant(participantID));

        return true;
    }
}
