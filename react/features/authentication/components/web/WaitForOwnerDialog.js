// @flow

import axios from 'axios';
import React, { PureComponent } from 'react';
import type { Dispatch } from 'redux';

import tokenLocalStorage from '../../../../api/tokenLocalStorage';
import { getAuthUrl } from '../../../../api/url';
import { getCurrentUser } from '../../../base/auth';
import { disconnect } from '../../../base/connection';
import { Dialog } from '../../../base/dialog';
import { translate, translateToHTML } from '../../../base/i18n';
import { setJWT } from '../../../base/jwt';
import { connect } from '../../../base/redux';
import { safeDecodeURIComponent } from '../../../base/util';
import { cancelWaitForOwner } from '../../actions.web';

/**
 * The type of the React {@code Component} props of {@link WaitForOwnerDialog}.
 */
type Props = {

    /**
     * The name of the conference room (without the domain part).
     */
    _room: string,

    /**
     * Redux store dispatch method.
     */
    dispatch: Dispatch<any>,

    /**
     * Function to be invoked after click.
     */
    onAuthNow: ?Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * Authentication message dialog for host confirmation.
 *
 * @returns {React$Element<any>}
 */
class WaitForOwnerDialog extends PureComponent<Props> {
    /**
     * Instantiates a new component.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._onCancelWaitForOwner = this._onCancelWaitForOwner.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    _onCancelWaitForOwner: () => void;

    /**
     * Called when the cancel button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onCancelWaitForOwner() {
        const { dispatch } = this.props;

        dispatch(cancelWaitForOwner());
    }

    _onSubmit: () => void;

    /**
     * Called when the OK button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onSubmit() {
        const { dispatch, onAuthNow } = this.props;

        const apiBase = getAuthUrl();
        axios.get(`${apiBase}/logout`).then(() => {
            tokenLocalStorage.removeItem(APP.store.getState());
            dispatch(setJWT());
            onAuthNow && onAuthNow();
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const {
            _room: room,
            description,
            t,
            useLogin,
            submitDisabled,
            ...dialogProps
        } = this.props;

        if (!room) {
            return null;
        }

        return (
            <Dialog
                okKey = { 'dialog.login' }
                cancelKey = { 'dialog.goHome' }
                disableBlanketClickDismiss = { true }
                hideCloseIconButton = { true }
                onCancel = { this._onCancelWaitForOwner }
                onSubmit = { this._onSubmit }
                submitDisabled = { !useLogin }
                titleKey = { 'dialog.WaitingForHost' }
                width = { 'small' }
                {...dialogProps}>
                <span>
                    { translateToHTML(
                        t,
                        'dialog.WaitForHostMsg',
                        { room: decodeURI(room) }) }
                </span>
            </Dialog>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code WaitForOwnerDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function mapStateToProps(state) {
    const { authRequired } = state['features/base/conference'];
    const { waitOnlyGuestEnabled, useLogin } = state['features/base/config'];
    const isAuthenticated = Boolean(getCurrentUser(state));
    let submitDisabled;
    let cancelDisabled;
    let description;

    if (isAuthenticated) {
        submitDisabled = true;
    }

    if (waitOnlyGuestEnabled) {
        description = 'dialog.WaitingRoomMsg';
        cancelDisabled = true;
        submitDisabled = true;
    }

    return {
        cancelDisabled,
        description,
        submitDisabled,
        useLogin,
        _room: authRequired && safeDecodeURIComponent(authRequired.getName())
    };
}

export default translate(connect(mapStateToProps)(WaitForOwnerDialog));
