// @flow

import React, { PureComponent } from 'react';

import Dialog from '../../../base/dialog/components/web/Dialog';
import { translate, translateToHTML } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { sendConsentDisagreeNotification } from '../../functions';

const AUTH_PAGE_BASE = process.env.VMEETING_FRONT_BASE;

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
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * Data flagship Consent Form 1 .
 *
 * @returns {React$Element<any>}
 */
class LoginDialogDID extends PureComponent<Props> {
    /**
     * Instantiates a new component.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);
        this.state = {
            show: true
        };
        this._onCancelDialog = this._onCancelDialog.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    _onCancelDialog: () => void;

    /**
     * Called when the cancel button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onCancelDialog() {
        this.setState({show: false});
        sendConsentDisagreeNotification(this.props.dispatch);
        // alert("TODO: DID Disagreed.. Will be handled on integration.")
    }

    _onSubmit: () => void;

    /**
     * Called when the OK button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onSubmit() {
        const { _roomName } = this.props;
        this.setState({show: false});

        window.location.href = `${AUTH_PAGE_BASE}/login?next=${encodeURIComponent(`/${_roomName}`)}`;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const {
            t,
            ...dialogProps
        } = this.props;

        return (
            this.state.show && <Dialog
                okKey = { 'dialog.login' }
                cancelKey = { 'dialog.Cancel' }
                onX={ this._onCancelDialog }
                consentDialog={true}
                disableBlanketClickDismiss = { true }
                hideCloseIconButton = { false }
                onCancel = { this._onCancelDialog }
                onSubmit = { this._onSubmit }
                titleKey = { 'dialog.login' }
                width = { 'small' }
                >
                <div className="consent-message-login">
                    <span>
                        {translateToHTML(t, t('dialog.consent.dialogLoginMessage'))}
                    </span>
                </div>
            </Dialog>
        );
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The props passed to the component.
 * @returns {Object}
 */
function mapStateToProps(state, ownProps): Object {
    const _roomName = state['features/base/conference'].room;

    return {
        _roomName,
    };
}

export default translate(connect(mapStateToProps)(LoginDialogDID));

