// @flow

import React, { PureComponent } from 'react';
import { FieldTextStateless as TextField } from '@atlaskit/field-text';
import Button from '@atlaskit/button/standard-button';
import ButtonGroup from '@atlaskit/button/button-group';
import Modal, { ModalFooter } from '@atlaskit/modal-dialog';

import { translate, translateToHTML } from '../../../base/i18n';
import Dialog from '../../../base/dialog/components/web/Dialog';
import { openConsentDialogThree, openConsentDialogOne } from '../../actions.any';
import * as validators from '../../../../utils/validator';
import axios from 'axios';
import { getAuthUrl } from "../../../../api/url";
import tokenLocalStorage from '../../../../api/tokenLocalStorage';
import { setJWT } from '../../../base/jwt';
import { checkPhoneNumber, savePhoneNumber, sendConsentDisagreeNotification } from './functions';

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
class ConsentDialogTwo extends PureComponent<Props> {
    /**
     * Instantiates a new component.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);
        this.state = {
            phoneNumberError: false,
            show: true
        }

        this._onCancelDialog = this._onCancelDialog.bind(this);
        this._onPrev         = this._onPrev.bind(this);
        this._onNext         = this._onNext.bind(this);
        this._onPhoneNumberChange = this._onPhoneNumberChange.bind(this);
        this._checkIfPhoneExists  = this._checkIfPhoneExists.bind(this); 

        this._checkIfPhoneExists();
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
        sendConsentDisagreeNotification(APP.store.dispatch);this.setState({show: false});
    }

    _onPrev: () => void;

    _onPrev(){
        this.setState({show: false});
        APP.store.dispatch(openConsentDialogOne());
    }

    _onNext: () => void;

    /**
     * Called when the OK button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onNext() {
        this.setState({show: false});
        APP.store.dispatch(openConsentDialogThree());
    }

    async _checkIfPhoneExists(){
        try{
            const number = await checkPhoneNumber();
            if (number!== undefined){
                this.setState({phoneNumber: number})
            }
        }catch(err){
            console.log("vmchg: Error on request of phoneNumberExist ", err);
        }
    }

    async _savePhoneNumber(){
       const res = await savePhoneNumber(this.state.phoneNumber)
       console.log("vmchg: Saved", res ) 
    }

    async _onPhoneNumberChange(e){
        await this.setState({[e.target.name]: e.target.value});
        if(this.state.phoneNumber){
            let errorState = undefined;
            if (validators.phoneNumber(this.state.phoneNumber)){
                errorState = true;
            }else{
                errorState = false;
                this._savePhoneNumber();
            }
            this.setState({phoneNumberError: errorState});  
        }
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
                okDisabled = {this.state.phoneNumberError}
                disableFooter = { true }
                onCancel = { this._onCancelDialog }
                titleKey = { 'dialog.consent.titleDialogTwo' }
                width = { 'small' }
                >
                <div className="consent-message">
                    <div className="consent-two-wrapper">
                    
                        <div className="consent-two-info">
                            <span>
                                {translateToHTML(t,t('dialog.consent.dialogTwoMessage'))}
                            </span>
                        </div>

                        <div className="phone-input-block"> 
                            <div className="consent-form">
                                <div className="consent-form-title">
                                    <strong><span>{ t('dialog.name')}</span></strong>
                                </div> 
                                <div className="consent-form-input"> 
                                    <span>{APP.store.getState()["features/base/participants"].local.name.substring(0,11)+"..."}</span>
                                </div> 
                                <div className="consent-form-gap"></div>
                            </div> 

                            <div className="consent-form">
                                <div className="consent-form-title">
                                   <strong> {t('dialog.consent.phoneNumber')} </strong>
                                </div>
                                <div className="consent-form-input">
                                <input
                                    autoFocus = { true }
                                    className = 'consent-form-input-textbox remove-inc-dec-in-input-box'
                                    name = 'phoneNumber'
                                    onChange = { this._onPhoneNumberChange }
                                    value = { this.state.phoneNumber ?? "" } 
                                    type = 'number' /> 
                                </div>
                                <div className="consent-form-gap"></div>
                            </div>
                                
                            <div className="consent-phone-error">
                                <div className="title"></div> 
                                <div className="error"> 
                                    {this.state.phoneNumberError && <span className="consent-error">
                                        { t('dialog.consent.invalidPhoneNumber')}
                                    </span>}

                                </div>
                            </div>
                        </div>
                    </div>

                    </div>
                    <div className="prev-next-button-wrapper">
                        <ButtonGroup>
                            <Button
                                appearance = 'primary'
                                key = 'submit'
                                onClick = { this._onNext }
                                type = 'button'>
                                { t('dialog.consent.next') }
                            </Button>
                            <Button
                                appearance = 'subtle'
                                key = 'cancel'
                                onClick = {this._onPrev }
                                type = 'button'>
                                { t('dialog.consent.prev') }
                            </Button> 
                        </ButtonGroup>
                    </div>
            </Dialog>
        );
    }
}


export default translate(ConsentDialogTwo);

