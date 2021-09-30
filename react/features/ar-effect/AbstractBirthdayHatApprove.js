// @flow

import { PureComponent } from 'react';
import { getLocalVideoTrack } from '../base/tracks';

export type Props = {

    _participantId: String,

    /**
     * True if the list should be rendered.
     */
    _visible: boolean,

    /**
     * The Redux Dispatch function.
     */
    dispatch: Function,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * Abstract class to encapsulate the platform common code of the {@code BirthdayApproval}.
 */
export default class AbstractBirthdayHatApprove<P: Props = Props> extends PureComponent<P> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: P) {
        super(props);

        this._onRespondToParticipant = this._onRespondToParticipant.bind(this);
    }

    _onRespondToParticipant: (boolean) => Function;

    /**
     * Function that constructs a callback for the response handler button.
     *
     * @param {boolean} approve - The response for putting hat.
     * @returns {Function}
     */
    _onRespondToParticipant(approve) {
        return () => {
            // console.log("TODO-ANIS: Trigger the action on approval button." + approve);
            // this.props.dispatch(setKnockingParticipantApproval(id, approve));
        };
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
export function mapStateToProps(state: Object): $Shape<Props> {

    return {
        _isAREnabled: Boolean(state['features/ar-effect'].arEffectEnabled),
        _jitsiTrack: getLocalVideoTrack(state['features/base/tracks'])?.jitsiTrack,
        _isARApprvalDialogVisible: Boolean(state['features/ar-effect'].arApprovalDialog)
    };
}
