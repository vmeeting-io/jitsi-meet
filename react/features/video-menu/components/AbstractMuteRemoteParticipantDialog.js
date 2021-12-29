// @flow

import { Component } from 'react';

import { MEDIA_TYPE } from '../../base/media';
import { muteRemote } from '../actions';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractMuteRemoteParticipantDialog}.
 */
export type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The ID of the remote participant to be muted.
     */
    participantID: string,

    /**
     * Function to translate i18n labels.
     */
    t: Function
};

/**
 * Abstract dialog to confirm a remote participant mute action.
 *
 * @augments Component
 */
export default class AbstractMuteRemoteParticipantDialog<P:Props = Props, State=void>
    extends Component<P, State> {
    /**
     * Initializes a new {@code AbstractMuteRemoteParticipantDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: P) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onSubmit = this._onSubmit.bind(this);
    }

    _onSubmit: () => boolean;

    /**
     * Handles the submit button action.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        const { dispatch, participantID } = this.props;

        dispatch(muteRemote(participantID, MEDIA_TYPE.AUDIO));

        return true;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @private
 * @returns {{
 *      _audioTrackMuted: boolean
 *  }}
 */
export function _mapStateToProps(state: Object, ownProps: Props) {
    const tracks = state['features/base/tracks'];

    return {
        _audioTrackMuted: isRemoteTrackMuted(
            tracks, MEDIA_TYPE.AUDIO, ownProps.participantID)
    };
}
