// @flow

import type { Dispatch } from 'redux';

import { openDialog,closeDialog, toggleDialog, hideDialog } from '../base/dialog';
import { DIDProcessingDialog, LoginDialogDID } from './components/web';
import {ConsentDialogOne,ConsentDialogTwo,ConsentDialogThree} from './components/web';


/**
 * Opens {@link ConsentDialogOne} which will show information about 
 * flagship data collection regulations based on Korean Law.
 *
 * @protected
 * @returns {Action}
 */
export function openConsentDialogOne() {
    return function(dispatch, getState) {
        const { enableDIDConsent } = getState()['features/base/config'];
        if (enableDIDConsent) {
            dispatch(openDialog(ConsentDialogOne));
        }
    }
}

/**
 * Closes {@link ConsentDialogOne} which will show information about 
 * flagship data collection regulations based on Korean Law.
 *
 * @protected
 * @returns {Action}
 */
export function closeConsentDialogOne() {
    console.log("Consent Dialog one closed")
    return hideDialog(ConsentDialogOne);
}


/**
 * Opens {@link ConsentDialogTwo} which will show information about 
 * flagship data collection regulations based on Korean Law.
 *
 * @protected
 * @returns {Action}
 */
export function openConsentDialogTwo() {
    // console.log("vmchg: Open Consent Dialog Two")
    return function(dispatch, getState) {
        const { enableDIDConsent } = getState()['features/base/config'];
        if (enableDIDConsent) {
            dispatch(openDialog(ConsentDialogTwo));
        }
    }
}

/**
 * Close {@link ConsentDialogTwo} which will show information about 
 * flagship data collection regulations based on Korean Law.
 *
 * @protected
 * @returns {Action}
 */
 export function closeConsentDialogTwo() {
    return closeDialog(ConsentDialogTwo);
}


/**
 * Opens {@link ConsentDialogThree} which will show information about 
 * flagship data collection regulations based on Korean Law.
 *
 * @protected
 * @returns {Action}
 */
export function openConsentDialogThree() {
    return function(dispatch, getState) {
        const { enableDIDConsent } = getState()['features/base/config'];
        if (enableDIDConsent) {
            dispatch(openDialog(ConsentDialogThree));
        }
    }
}

/**
 * Closes {@link ConsentDialogThree} which will show information about 
 * flagship data collection regulations based on Korean Law.
 *
 * @protected
 * @returns {Action}
 */
export function closeConsentDialogThree() {
    return closeDialog(ConsentDialogThree);
}

/**
 * 
 * Open LoginDialogDID popup
 * @protected
 * @returns{Action} 
 */
export function openLoginDialogDIDPopUp() {
    return function(dispatch, getState) {
        const { enableDIDConsent } = getState()['features/base/config'];
        if (enableDIDConsent) {
            dispatch(openDialog(LoginDialogDID));
        }
    }
}

export function openDIDProcessingDialog(){
    return function(dispatch, getState){
        const { enableDIDConsent } = getState()['features/base/config'];
        if (enableDIDConsent) {
            dispatch(openDialog(DIDProcessingDialog));
        }
    }
}