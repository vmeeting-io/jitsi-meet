// @flow

import React from 'react';
import { THIRD_PARTY_PREJOIN_BUTTONS } from '../../base/config/constants';

import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import AbstractBirthdayHatApprove, {
    mapStateToProps as abstractMapStateToProps,
    type Props as AbstractProps
} from '../AbstractBirthdayHatApprove';
import { arApprovalDialog, toggleAREffect } from '../actions';
import BirthdayApprove from './BirthdayApprove';

type Props = AbstractProps & {

    /**
     * True if the toolbox is visible, so we need to adjust the position.
     */
    _toolboxVisible: boolean
};

/**
 * Component to render a list for the actively knocking participants.
 */
class BirthdayHatApprove extends AbstractBirthdayHatApprove<Props> {

    constructor(props) {
        super(props)

        this._onApprove = this._onApprove.bind(this);
        this._onReject = this._onReject.bind(this);
        this._enableARHat = this._enableARHat.bind(this);
    }


    componentDidMount(){
        this._enableARHat(true)
    }

    _enableARHat(enabled){
        const option = {
            enabled: enabled,
            arSource: ''
        }
        this.props.dispatch(toggleAREffect(option, this.props._jitsiTrack));
    }

    _onApprove() {
        this._enableARHat(true);
        this.props.dispatch(arApprovalDialog(false));

    }

    _onReject() {
        this._enableARHat(false);
        this.props.dispatch(arApprovalDialog(false));
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _participants, _isARApprvalDialogVisible, t ,_isAREnabled} = this.props;
        if (!_isARApprvalDialogVisible) {
            return null;
        }

        return (
            <BirthdayApprove
                onApprove={this._onApprove}
                onReject={this._onReject} />
        );
    }

    _onRespondToParticipant: (boolean) => Function;
}

export default translate(connect(abstractMapStateToProps)(BirthdayHatApprove));
