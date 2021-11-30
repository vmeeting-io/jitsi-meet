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
 * Data flagship Consent Form - Prejoin .
 *
 * @returns {React$Element<any>}
 */
class DIDProcessingDialog extends PureComponent<Props> {
    /**
     * Instantiates a new component.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);
        this.state = {
            class: localStorage.language !== "ko" ? "":"-kr",
            show: true
        }

        this._onCancelDialog = this._onCancelDialog.bind(this);
        this._onX = this._onX.bind(this);
    }

    _onCancelDialog: () => void;

    /**
     * Called when the cancel button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onCancelDialog() {
        this._closeModal();
    }

    _onX: () => void;

    /**
     * Called on pressing X button.
     * @private
     * @returns {void}
     */
    _onX(){
        this._onCancelDialog();
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
                    okKey = { 'dialog.Ok' }
                    disableBlanketClickDismiss = { false }
                    onX={ this._onCancelDialog }
                    consentDialog={true}
                    hideCancelButton = { true }
                    onSubmit = { this._onCancelDialog }
                    titleKey = { 'dialog.consent.titleDialogThree' }
                    width = { 'small' }
                    >
                    
                    <div className="consent-message-login">
                        <span>
                            {translateToHTML(t, t('dialog.consent.notice.verificationOnProcess'))}
                        </span>
                    </div>                    
                </Dialog>}

            </div>
        );
    }
}

                


export default translate(DIDProcessingDialog);


