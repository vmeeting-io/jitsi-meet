// @flow

import axios from 'axios';
import React, { PureComponent } from 'react';

import { translate, translateToHTML } from '../../../base/i18n';
import Dialog from '../../../base/dialog/components/web/Dialog';
import { checkDIDConsent, sendConsentAgreeNotification,sendConsentDisagreeNotification, sendConsentVerifyOnProgressNotification} from './functions';
import { PIC_CONSENT } from '../../../base/participants';



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
class ConsentDialogThree extends PureComponent<Props> {
    /**
     * Instantiates a new component.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);
        this.state = {
            class: localStorage.language !== "ko" ? "consent-message":"consent-message-kr",
            show: true
        }

        this._onCancelDialog = this._onCancelDialog.bind(this);
        this._onAgree = this._onAgree.bind(this);
    }

    _onCancelDialog: () => void;

    /**
     * Called when the cancel button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onCancelDialog() {
        sendConsentDisagreeNotification(APP.store.dispatch)
        this._closeModal();
        alert("TODO: DID Disagreed.. Will be handled on integration.")

    }

    _onAgree: () => void;

    /**
     * Called when the OK button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onAgree() {
        // 1. Check consent at DID server and save current state. 
        checkDIDConsent().then(resp=>{
            if(resp.data.consent===PIC_CONSENT.APPROVED){
                sendConsentAgreeNotification(APP.store.dispatch)
                this._closeModal();
                alert("TODO: DID Agreed.. Will be handled on integration.")

            }else{
                sendConsentVerifyOnProgressNotification(APP.store.dispatch)
            }
        });
    }

    /**
     * Closes the popup modal.
     * @private
     * @returns {void}
     */
    _closeModal(){
        this.setState({show: false});
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
            <div>


            {this.state.show && <Dialog
                okKey = { 'dialog.consent.complete' }
                // cancelKey = { 'dialog.consent.cancel' }
                disableBlanketClickDismiss = { false }
                hideCancelButton = { true }
                // hideCloseIconButton = { false }
                onCancel = { this._onCancelDialog }
                onSubmit = { this._onAgree }
                titleKey = { 'dialog.consent.titleDialogThree' }
                width = { 'small' }
                >

                <div className={`${this.state.class}`}>
                    <div className="consent-three-wrapper">
                        <div className = 'barcode'>
                            <img src='/static/consentBarcode.png' />
                        </div>
                        <div className = 'consent-three-info'>
                            <span>
                                {translateToHTML(t,t('dialog.consent.dialogThreeMessage'))}
                            </span>
                        </div>
                    </div>
                </div>

                
            </Dialog>}

            </div>
        );
    }
}


export default translate(ConsentDialogThree);

