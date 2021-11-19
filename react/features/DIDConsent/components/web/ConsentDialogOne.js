// @flow

import axios from 'axios';
import React, { PureComponent } from 'react';

import { translate, translateToHTML } from '../../../base/i18n';
import Dialog from '../../../base/dialog/components/web/Dialog';
import { closeConsentDialogOne, openConsentDialogTwo } from '../../actions.any';
import { sendConsentDisagreeNotification, sendConsentAgreeNotification } from './functions';
import { denyDID, openOnNewTab } from '../../../base/participants';

/**
 * The type of the React {@code Component} props of {@link WaitForOwnerDialog}.
 */
type Props = {
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
            show: true,
            class: localStorage.language !== "ko" ? "":"-kr",
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
        this.setState({show: false});
        APP.store.dispatch(openConsentDialogTwo());
    }

    /**
     * Open View More tab on URL. 
     */
    _openOnNewTab(){
        const enLink = window.config.DID.enLink;
        const krLink = window.config.DID.krLink;
        const VIEW_MORE_URL = localStorage.language === 'ko' ? krLink:enLink;    
        openOnNewTab(VIEW_MORE_URL);
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
                onX={ this._onCancelDialog }
                consentDialog={true}
                disableBlanketClickDismiss = { true }
                onCancel = { this._onCancelDialog }
                onSubmit = { this._onSubmit }
                titleKey = { 'dialog.consent.titleDialogOne' }
                width = { 'small' }
                >
                <div className={`consent-message${this.state.class}`}>
                    <span>
                        {translateToHTML(t,t('dialog.consent.dialogOneMessage'))}
                    </span>
                    <div className={`view-more${this.state.class}`}>
                        <a href onClick={this._openOnNewTab} >{t('dialog.consent.notice.viewMore')}</a>
                    </div>
                </div>
            </Dialog>
        );
    }
}


export default translate(ConsentDialogOne);

