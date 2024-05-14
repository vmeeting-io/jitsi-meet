// @flow

import React from 'react';
import { connect } from 'react-redux';
import { THIRD_PARTY_PREJOIN_BUTTONS } from '../../base/config/constants';

import { translate } from '../../base/i18n/functions';
import AbstractBirthdayHatApprove, {
    mapStateToProps as abstractMapStateToProps,
    type Props as AbstractProps
} from '../AbstractBirthdayHatApprove';
import BirthdayApproveDialog from './BirthdayApproveDialog';

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
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _isARApprvalDialogVisible, t } = this.props;
        if (!_isARApprvalDialogVisible) {
            return null;
        }

        return (
            <BirthdayApproveDialog
                onApprove={this._onRespondToParticipant(true)}
                onReject={this._onRespondToParticipant(false)} />
        );
    }

    _onRespondToParticipant: (boolean) => Function;
}

export default translate(connect(abstractMapStateToProps)(BirthdayHatApprove));
