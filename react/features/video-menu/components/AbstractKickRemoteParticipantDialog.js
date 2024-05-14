import { Component } from 'react';

import { createRemoteVideoMenuButtonEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { kickParticipant } from '../../base/participants/actions';

/**
 * Abstract dialog to confirm a remote participant kick action.
 */
export default class AbstractKickRemoteParticipantDialog
    extends Component {
    /**
     * Initializes a new {@code AbstractKickRemoteParticipantDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Callback for the confirm button.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        const { dispatch, participantID } = this.props;

        sendAnalytics(createRemoteVideoMenuButtonEvent(
            'kick.button',
            {
                'participant_id': participantID
            }));

        dispatch(kickParticipant(participantID));

        return true;
    }
}
