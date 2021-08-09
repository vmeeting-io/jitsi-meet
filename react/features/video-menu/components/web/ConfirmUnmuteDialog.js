// @flow

import React, { Component } from 'react';

import { Dialog } from '../../../base/dialog';
import { connect } from '../../../base/redux';

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before muting a remote participant.
 *
 * @extends Component
 */
class ConfirmUnmuteDialog extends Component {
    constructor(props) {
        super(props);

        this._onCancel = this._onCancel.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    _onSubmit() {
        this.props.onSubmit && this.props.onSubmit();
    }

    _onCancel() {
        this.props.onCancel && this.props.onCancel();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
     render() {
        return (
            <Dialog { ...this.props } />
        );
    }
};

function _mapStateToProps(state: Object, ownProps: Props) {
    return {
        titleKey: ownProps.contentKey,
        width: 'small'
    };
};

export default connect(_mapStateToProps)(ConfirmUnmuteDialog);
