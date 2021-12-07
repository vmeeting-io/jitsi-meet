// @flow

import React, { PureComponent } from 'react';

import { connect } from '../../../../base/redux';
import DeviceStatus from '../../../../prejoin/components/preview/DeviceStatus';
import { Toolbox } from '../../../../toolbox/components/web';
import { PREMEETING_BUTTONS, THIRD_PARTY_PREJOIN_BUTTONS } from '../../../config/constants';

import ConnectionStatus from './ConnectionStatus';
import Preview from './Preview';
import { withTranslation } from 'react-i18next';
import ButtonGroup from '@atlaskit/button/button-group';
import Button from '@atlaskit/button/standard-button';
import { getLocalParticipant, isDIDDenied, openOnNewTab, PIC_CONSENT } from '../../../participants';
import { translateToHTML } from '../../../i18n';
import * as validators from '../../../../../utils/validator';
import { savePhoneNumber, checkPhoneNumber, checkDIDConsent } from '../../../../DIDConsent/components/web/functions';
import { openDIDProcessingDialog } from '../../../../DIDConsent/actions.any';

const AUTH_PAGE_BASE = process.env.VMEETING_FRONT_BASE;

/**
 * Wraps a specific React Component in order to enable translations in it.
 *
 * @param {Component} component - The React Component to wrap.
 * @returns {Component} The React Component which wraps {@link component} and
 * enables translations in it.
 */
export function translate(component) {
    // Use the default list of namespaces.
    return withTranslation([ 'main', 'languages', 'countries', 'vmeeting'])(component);
}

/**
 * The ID to be used for the cancel button if enabled.
 * @type {string}
 */
 const CANCEL_BUTTON_ID = 'did-cancel-button';

 /**
  * The ID to be used for the ok button if enabled.
  * @type {string}
  */
 const OK_BUTTON_ID = 'did-ok-button';


type Props = {

    /**
     * The list of toolbar buttons to render.
     */
    _buttons: Array<string>,

    /**
     * The branding background of the premeeting screen(lobby/prejoin).
     */
    _premeetingBackground: string,

    /**
     * Children component(s) to be rendered on the screen.
     */
    children?: React$Node,

    /**
     * Additional CSS class names to set on the icon container.
     */
    className?: string,

    /**
     * The name of the participant.
     */
    name?: string,

    /**
     * Indicates whether the copy url button should be shown
     */
    showCopyUrlButton: boolean,

    /**
     * Indicates whether the device status should be shown
     */
    showDeviceStatus: boolean,

    /**
     * The 'Skip prejoin' button to be rendered (if any).
     */
     skipPrejoinButton?: React$Node,

    /**
     * Used for translation.
     */
    t: Function,
    
    /**
     * Title of the screen.
     */
    title?: string,

    /**
     * Whether it's used in the 3rdParty prejoin screen or not.
     */
    thirdParty?: boolean,

    /**
     * True if the preview overlay should be muted, false otherwise.
     */
    videoMuted?: boolean,

    /**
     * The video track to render as preview (if omitted, the default local track will be rendered).
     */
    videoTrack?: Object
}

/**
 * Implements a pre-meeting screen that can be used at various pre-meeting phases, for example
 * on the prejoin screen (pre-connection) or lobby (post-connection).
 */
class PreMeetingScreen extends PureComponent<Props> {
    /**
     * Default values for {@code Prejoin} component's properties.
     *
     * @static
     */
    static defaultProps = {
        showCopyUrlButton: true,
        showToolbox: true
    };
    constructor(props) {
        super(props);
        this.state = {
            class: localStorage.language !== "ko" ? "":"-kr",
            showDID: this.props.showDID,
            page: 1,
            phoneNumber:"",
            phoneNumberError:false,
        };
        this._didContentPageOne   = this._didContentPageOne.bind(this);
        this._didContentPageTwo   = this._didContentPageTwo.bind(this);
        this._didContentPageThree = this._didContentPageThree.bind(this);
        this._renderCancelButton  = this._renderCancelButton.bind(this);
        this._renderOKButton      = this._renderOKButton.bind(this);
        this._onCancel            = this._onCancel.bind(this);
        this._onAgreePageOne      = this._onAgreePageOne.bind(this);

        this._onPrev              = this._onPrev.bind(this);
        this._onNext              = this._onNext.bind(this);
        this._onPhoneNumberChange = this._onPhoneNumberChange.bind(this);
        this._checkIfPhoneExists  = this._checkIfPhoneExists.bind(this); 

        this._onCancelLoginDialog = this._onCancelLoginDialog.bind(this);
        this._onLogin             = this._onLogin.bind(this);
        this._notLoggedIn          = this._notLoggedIn.bind(this);
        this._onComplete          = this._onComplete.bind(this);
        
        this._checkIfPhoneExists();
    }


    _onComplete(){
         // 1. Check consent at DID server and save current state. 
         checkDIDConsent().then(resp=>{
            if(resp.data.consent===PIC_CONSENT.APPROVED){
                this._onCancel();
            }else{
                APP.store.dispatch(openDIDProcessingDialog());
                //TODO Handle 
            }
        });
    }

    /**
     *Check if user is logged in or not.
     *  
     * @returns Returns true if not logged in, else false
     */
    _notLoggedIn(){
        const state = APP.store.getState();
        const participant = getLocalParticipant(state);
        
        return participant.email === undefined ? true : false;
    }

    _onCancelLoginDialog: () => void;

    /**
     * Called when the cancel button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onCancelLoginDialog() {
        this.setState({showLoginPage: false});
        // sendConsentDisagreeNotification(APP.store.dispatch);
    }

    _onLogin: () => void;

    /**
     * Called when the Login button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onLogin() {
        const roomName = APP.store.getState()["features/base/conference"].room;

        window.location.href = `${AUTH_PAGE_BASE}/login?next=${encodeURIComponent(`/${roomName}`)}`;
        
    }


    _onPrev: () => void;

    /**
     * Moves to Previous Consent Dialog(Consent Form 1)
     */
    _onPrev(){
        this.setState({page: 1});
    }

    _onNext: () => void;

    /**
     * Called when the Next button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onNext() {
        this._savePhoneNumber();
        this.setState({page: 3});
    }

    /**
     * Checks if phone number is present in vmeeting database
     * and sets it into the state variable of this component.
     * 
     */
    async _checkIfPhoneExists(){
        try{
            const number = await checkPhoneNumber();
            if (number!== undefined){
                this.setState({phoneNumber: number})
            }
        }catch(err){
            console.log("DIDPhoneNumberCheckError ", err);
        }
    }

    /**
     * Save phone number entered in this component to vmeeting database.
     * 
     */
    async _savePhoneNumber(){
       const res = await savePhoneNumber(this.state.phoneNumber)
    }
    
    async _onPhoneNumberChange(e){
        await this.setState({[e.target.name]: e.target.value});
        if(this.state.phoneNumber){
            let errorState = undefined;
            if (validators.phoneNumber(this.state.phoneNumber)){
                errorState = true;
            }else{
                errorState = false;
                await this._savePhoneNumber();
            }
            await this.setState({phoneNumberError: errorState});  
        }
    }

    /**
     * Truncates name with length greater than 20.
     * 
     * @param {String} name 
     * @returns Truncated name with suffix "..."
     */
    _getShortName(name){
        if (name.length>20){
            return name.substring(0,16)+"...";
        }else{
            return name
        }
    }

    _onDisagreePageOne(){
        this._onCancel();
    }
    
    _onAgreePageOne(){
        this.setState({page: 2});
    }
    
    _onCancel(){
        this.setState({showDID: false});
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
     * Renders Cancel button.
     *
     * @private
     * @returns {ReactElement|null} The Cancel button if enabled and dialog is
     * not modal.
     */
    _renderCancelButton() {
        const {
            t /* The following fixes a flow error: */ = _.identity,
        } = this.props;
    
        return (
            <Button
                appearance = 'subtle'
                id = { CANCEL_BUTTON_ID }
                key = 'cancel'
                onClick = { this._onCancel }
                type = 'button'>
                { t('dialog.Cancel') }
            </Button>
        );
    }
    
    /**
     * Renders OK button.
     *
     * @private
     * @returns {ReactElement|null} The OK button if enabled.
     */
    _renderOKButton() {
    
        const {
            t /* The following fixes a flow error: */ = _.identity
        } = this.props;
    
        return (
            <Button
                appearance = 'primary'
                form = 'modal-dialog-form'
                id = { OK_BUTTON_ID }
                // isDisabled = { this.props.okDisabled }
                key = 'submit'
                onClick = { this._onAgreePageOne }
                type = 'button'>
                { t('dialog.Ok') }
            </Button>
        );
    }

    _didContentLoginPage(){
        const {t} = this.props;
        return(
            <div className="prejoin-did">
                <div className={`consent-message-title`}>
                    <span>
                        {t('dialog.consent.titleDialogOne')}
                    </span>
                </div>
                <div className="consent-message-login">
                    <span className="did-v2-font">
                        {translateToHTML(t, t('dialog.consent.dialogLoginMessage'))}
                    </span>
                </div>

                <div className="prev-next-button-wrapper">
                    <ButtonGroup>
                        <Button
                            appearance = 'primary'
                            key = 'submit'
                            onClick = { this._onLogin }
                            type = 'button'>
                            { t('dialog.login') }
                        </Button>
                        <Button
                            appearance = 'subtle'
                            key = 'cancel'
                            onClick = {this._onCancel }
                            type = 'button'>
                            { t('dialog.consent.cancel') }
                        </Button> 
                    </ButtonGroup>
                </div> 
            </div>
        )
    }

    _didContentPageOne(){
        const {t} = this.props;

        return (
            <div className="prejoin-did">
                <div className={`consent-message-title`}>
                    <span>
                        {t('dialog.consent.titleDialogOne')}
                    </span>
                </div>
                <div className={`consent-message${this.state.class}`}>
                    <span className="did-v2-font">
                        {t('dialog.consent.dialogOneMessage')}
                    </span>
                    <div className={`view-more${this.state.class}`}>
                        <a href className="did-v2-font" onClick={this._openOnNewTab} >{t('dialog.consent.notice.viewMore')}</a>
                    </div>
                </div>
                <div>
                    <div className="prev-next-button-wrapper">
                        <ButtonGroup>
                            <Button
                                appearance = 'primary'
                                key = 'submit'
                                onClick = { this._onAgreePageOne }
                                type = 'button'>
                                { t('dialog.consent.agree') }
                            </Button>
                            <Button
                                appearance = 'subtle'
                                key = 'cancel'
                                onClick = {this._onCancel }
                                type = 'button'>
                                { t('dialog.consent.disagree') }
                            </Button> 
                        </ButtonGroup>
                    </div> 
                </div>
            </div>
        );
    }

     _didContentPageTwo(){
        const {t} = this.props;

        return (
            <div className="prejoin-did">
                <div className={`consent-message-title`}>
                    <span>
                        {t('dialog.consent.titleDialogTwo')}
                    </span>
                </div>
                <div className={`consent-message${this.state.class}`}>
                    <div className="consent-two-wrapper">
                    
                        <div className={`consent-two-info${this.state.class}`}>
                            <span className="did-v2-font">
                                {t('dialog.consent.dialogTwoMessage')}
                            </span>
                        </div>

                        <div className="phone-input-block"> 
                            <div className="consent-form">
                                <div className="consent-form-title">
                                    <strong className="did-v2-font"><span>{ t('dialog.name')}</span></strong>
                                </div> 
                                <div className="consent-form-input"> 
                                    <span className="did-v2-font">{this._getShortName(APP.store.getState()["features/base/participants"].local.name)}</span>
                                </div> 
                                <div className="consent-form-gap"></div>
                            </div> 

                            <div className="consent-form-phone">
                                <div className={`consent-form-phone-title${this.state.class}`}>
                                   <strong className="did-v2-font"> {t('dialog.consent.phoneNumber')} </strong>
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
                                isDisabled={this.state.phoneNumber=="" || this.state.phoneNumberError}
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
            </div>
        );
    }

     _didContentPageThree(){
        const {t} = this.props;

        return (
            <div className="prejoin-did">
                <div className={`consent-message-title`}>
                    <span>
                        {t('dialog.consent.titleDialogThree')}
                    </span>
                </div>
                <div className={`consent-message${this.state.class}`}>
                    <div className="consent-three-wrapper">
                        <div className = 'barcode'>
                            <img src='/static/consentBarcode.png' />
                        </div>
                        <div className = 'consent-three-info'>
                            <span className="did-v2-font">
                                {translateToHTML(t,t('dialog.consent.dialogThreeMessage'))}
                            </span>
                        </div>
                    </div>
                </div> 
                <div className="prev-next-button-wrapper">
                        <ButtonGroup>
                            <Button
                                isDisabled={this.state.phoneNumber=="" || this.state.phoneNumberError}
                                appearance = 'primary'
                                key = 'submit'
                                onClick = { this._onComplete }
                                type = 'button'>
                                { t('dialog.consent.complete') }
                            </Button>
                            <Button
                                appearance = 'subtle'
                                key = 'cancel'
                                onClick = {this._onCancel }
                                type = 'button'>
                                { t('dialog.consent.cancel') }
                            </Button> 
                        </ButtonGroup>
                    </div>
            </div>
        );
    }

    _renderDid(){
        const notLoggedIn = this._notLoggedIn();
        return(
            <div className = 'content-controls'>
                { notLoggedIn && this._didContentLoginPage()}
                { !notLoggedIn && this.state.page===1 
                    && this._didContentPageOne()}
                { !notLoggedIn && this.state.page===2
                    && this._didContentPageTwo()}
                { !notLoggedIn && this.state.page===3 
                    && this._didContentPageThree()}
            </div>
        )
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
    
        const {
            _buttons,
            _premeetingBackground,
            children,
            className,
            showDeviceStatus,
            skipPrejoinButton,
            title,
            videoMuted,
            videoTrack
        } = this.props;

        const containerClassName = `premeeting-screen ${className ? className : ''}`;
        const style = _premeetingBackground ? {
            background: _premeetingBackground,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
        } : {};

        return (
            <div className = { containerClassName }>
                <div style = { style }>
                    <div className = 'content'>
                        <ConnectionStatus />
                        
                        { config.enableDIDConsent && this.state.showDID && this._renderDid() }      
                       
                        { !this.state.showDID && <div className = 'content-controls'>
                            <h1 className = 'title'>
                                { title }
                            </h1>
                            { children }
                            { _buttons.length && <Toolbox toolbarButtons = { _buttons } /> }
                            { skipPrejoinButton }
                            { showDeviceStatus && <DeviceStatus /> }
                        </div>}
                    </div>
                </div>
                <Preview
                    videoMuted = { videoMuted }
                    videoTrack = { videoTrack } />
            </div>
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
    const hideButtons = state['features/base/config'].hiddenPremeetingButtons || [];
    const premeetingButtons = ownProps.thirdParty
        ? THIRD_PARTY_PREJOIN_BUTTONS
        : PREMEETING_BUTTONS;
    const { premeetingBackground } = state['features/dynamic-branding'];

    return {
        _buttons: premeetingButtons.filter(b => !hideButtons.includes(b)),
        _premeetingBackground: premeetingBackground
    };
}

export default connect(mapStateToProps)(translate(PreMeetingScreen));
