// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { connect } from '../../../base/redux';

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before muting a remote participant.
 *
 * @extends Component
 */
class ConfirmUnmuteDialog extends Dialog {
    _onSubmit() {
        this.props.onSubmit && this.props.onSubmit();
    }

    _onCancel() {
        this.props.onCancel && this.props.onCancel();
    }
}

function _mapStateToProps(state: Object, ownProps: Props) {
    return {
        titleKey: ownProps.contentKey,
        width: 'small'
    };
};

export default connect(_mapStateToProps)(ConfirmUnmuteDialog);
