// @flow

import { Component } from 'react';

import { grantFollowMeModerator } from '../../follow-me';

type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The ID of the remote participant to be granted follow me moderator rights.
     */
    participantID: string,

    /**
     * The name of the remote participant to be granted follow me moderator rights.
     */
    participantName: string,

    /**
     * Function to translate i18n labels.
     */
    t: Function
};

/**
 * Abstract dialog to confirm granting follow me moderator to a participant.
 */
export default class AbstractGrantFollowMeModeratorDialog
    extends Component<Props> {
    /**
     * Initializes a new {@code AbstractGrantFollowMeModeratorDialog} instance.
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
        const { _isFollowMeModerator, dispatch, participantID } = this.props;

        dispatch(grantFollowMeModerator(participantID, !_isFollowMeModerator));

        return true;
    }
}
