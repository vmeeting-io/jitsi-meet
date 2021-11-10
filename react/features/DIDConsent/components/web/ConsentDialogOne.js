// @flow

import axios from 'axios';
import React, { PureComponent } from 'react';

import { translate, translateToHTML } from '../../../base/i18n';
import Dialog from '../../../base/dialog/components/web/Dialog';
import { closeConsentDialogOne, openConsentDialogTwo } from '../../actions.any';
import { sendConsentDisagreeNotification, sendConsentAgreeNotification } from './functions';
import { denyDID } from '../../../base/participants';

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
 * Data flagship Consent Form 1 .
 *
 * @returns {React$Element<any>}
 */
class ConsentDialogOne extends PureComponent<Props> {
    
    
    
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
        sendConsentDisagreeNotification(APP.store.dispatch);
        alert("TODO: DID Disagreed.. Will be handled on integration.")
    }

    _onSubmit: () => void;

    /**
     * Called when the OK button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onSubmit() {
        this.setState({show: false});
        APP.store.dispatch(openConsentDialogTwo());
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
                okKey = { 'dialog.consent.agree' }
                cancelKey = { 'dialog.consent.disagree' }
                // disableBlanketClickDismiss = { true }
                // hideCloseIconButton = { false }
                onCancel = { this._onCancelDialog }
                onSubmit = { this._onSubmit }
                titleKey = { 'dialog.consent.titleDialogOne' }
                width = { 'small' }
                >
                <div className="consent-message">
                    <span>
                        {translateToHTML(t,t('dialog.consent.dialogOneMessage'))}
                    </span>
                </div>
            </Dialog>
        );
    }
}


export default translate(ConsentDialogOne);

