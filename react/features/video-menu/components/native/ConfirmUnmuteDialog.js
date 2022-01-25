// @flow

import React from 'react';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import ConfirmDialog from '../../../base/dialog/components/native/ConfirmDialog';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before muting all remote participants.
 *
 * @extends ConfirmDialog
 */
class ConfirmUnmuteDialog extends ConfirmDialog {
    _onCancel() {
        this.props.onCancel && this.props.onCancel();
    }

    _onSubmit() {
        this.props.onSubmit && this.props.onSubmit();
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {{
    *     _dialogStyles: StyleType
    * }}
 */
function _mapStateToProps(state: Object, ownProps: Props) {
    return {
        _dialogStyles: ColorSchemeRegistry.get(state, 'Dialog')
    };
}

export default connect(_mapStateToProps)(ConfirmUnmuteDialog);
