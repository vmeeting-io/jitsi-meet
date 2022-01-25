// @flow

import { PureComponent } from 'react';
import { getLocalParticipant, updateParticipantBirthdayHatFlag } from '../base/participants';
import { arApprovalDialog } from './actions';
import { enableARHat } from './functions';

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
     * @param {boolean} approved - Flag with response for putting hat.
     * @returns {Function}
     */
    _onRespondToParticipant(approved) {
        return () => {
            const { _participantId } = this.props;
            if (!approved)
            {
                enableARHat(this.props.dispatch,false);
            }
            this.props.dispatch(arApprovalDialog(false));

            // depending on the value of the approved flag, we require to update presence for birthday hat flag
            this.props.dispatch(updateParticipantBirthdayHatFlag(_participantId, approved));
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
        _participantId: getLocalParticipant(APP.store.getState()).id,
        _isAREnabled: Boolean(state['features/ar-effect'].arEffectEnabled),
        _isARApprvalDialogVisible: Boolean(state['features/ar-effect'].arApprovalDialog)
    };
}
