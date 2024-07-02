// @flow

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import { translate, translateToHTML } from '../../../base/i18n/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
import { safeDecodeURIComponent } from '../../../base/util/uri';
import { cancelWaitForOwner, login } from '../../actions.web';

/**
 * Authentication message dialog for host confirmation.
 *
 * @returns {React$Element<any>}
 */
class WaitForOwnerDialog extends PureComponent {
    /**
     * Instantiates a new component.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._onCancelWaitForOwner = this._onCancelWaitForOwner.bind(this);
        this._onIAmHost = this._onIAmHost.bind(this);
    }

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

    /**
     * Called when the OK button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onIAmHost() {
        this.props.dispatch(login());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const {
            _room: room,
            _user,
            t
        } = this.props;

        return (
            <Dialog
                cancel = {{ translationKey:
                        this.props._alternativeCancelText ? 'dialog.WaitingForHostButton' : 'dialog.Cancel' }}
                disableBackdropClose = { true }
                hideCloseButton = { true }
                ok = {{
                    translationKey: 'dialog.IamHost',
                    hidden: Boolean(_user)
                }}
                onCancel = { this._onCancelWaitForOwner }
                onSubmit = { this._onIAmHost }
                titleKey = { t('dialog.WaitingForHostTitle') }>
                <span>
                    { translateToHTML(
                        t,
                        _user ? 'dialog.WaitingRoomMsg' : 'dialog.WaitForHostMsg',
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
    const { useLogin } = state['features/base/config'];
    const { membersOnly, lobbyWaitingForHost } = state['features/base/conference'];
    const { user } = state['features/base/jwt'];

    return {
        _alternativeCancelText: membersOnly && lobbyWaitingForHost,
        useLogin,
        _room: authRequired && safeDecodeURIComponent(authRequired.getName()),
        _user: user,
    };
}

export default translate(connect(mapStateToProps)(WaitForOwnerDialog));
