// @flow

import { Component } from 'react';
import { disableChatForAll } from '../../base/participants';
declare var APP: Object;
type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * Not sure if I will be using participant ID as prop
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
export default class AbstractDisableChatForAllParticipantsDialog
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
        const { dispatch } = this.props;
        dispatch(disableChatForAll());

        return true;
    }
}
