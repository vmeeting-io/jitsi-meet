// @flow

import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { ConfirmDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { cancelWaitForOwner, _openLoginDialog, stopWaitForOwner } from '../actions';
import { getLocationURL } from '../../../api/url';
import { Linking } from 'react-native';
import { appNavigate } from '../../app/actions';

/**
 * The type of the React {@code Component} props of {@link WaitForOwnerDialog}.
 */
type Props = {

    /**
     * The name of the conference room (without the domain part).
     */
    _room: string,

    /**
     * Redux store dispatch function.
     */
    dispatch: Dispatch<any>,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The dialog is display in XMPP password + guest access configuration, after
 * user connects from anonymous domain and the conference does not exist yet.
 *
 * See {@link LoginDialog} description for more details.
 */
class WaitForOwnerDialog extends Component<Props> {
    /**
     * Initializes a new WaitForWonderDialog instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onCancel = this._onCancel.bind(this);
        this._onLogin = this._onLogin.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _room: room
        } = this.props;

        return (
            <ConfirmDialog
                cancelKey = 'dialog.Cancel'
                contentKey = {
                    {
                        key: 'dialog.WaitForHostMsgWOk',
                        params: { room: decodeURI(room) }
                    }
                }
                okKey = 'dialog.Ok'
                onCancel = { this._onCancel }
                onSubmit = { this._onLogin } />
        );
    }

    _onCancel: () => void;

    /**
     * Called when the cancel button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        this.props.dispatch(cancelWaitForOwner());
    }

    _onLogin: () => void;

    /**
     * Called when the OK button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onLogin() {
        const { _room: room } = this.props;
        const url = `${this.props._loginURL}?next=%2F${room}`;

        this.props.dispatch(_openLoginDialog());
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code WaitForOwnerDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _room: string,
 *     _loginURL: string
 * }}
 */
function _mapStateToProps(state) {
    const { authRequired } = state['features/base/conference'];

    return {
        _room: authRequired && authRequired.getName()
    };
}

export default translate(connect(_mapStateToProps)(WaitForOwnerDialog));
