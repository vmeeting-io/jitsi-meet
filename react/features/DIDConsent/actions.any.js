// @flow

import type { Dispatch } from 'redux';

import { openDialog,closeDialog, toggleDialog, hideDialog } from '../base/dialog';
import { LoginDialogDID } from './components/web';
import {ConsentDialogOne,ConsentDialogTwo,ConsentDialogThree} from './components/web';


/**
 * Opens {@link ConsentDialogOne} which will show information about 
 * flagship data collection regulations based on Korean Law.
 *
 * @protected
 * @returns {Action}
 */
export function openConsentDialogOne() {
    return openDialog(ConsentDialogOne);
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
    return openDialog(ConsentDialogTwo);
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
    return openDialog(ConsentDialogThree);
}

/**
 * Closes {@link ConsentDialogThree} which will show information about 
 * flagship data collection regulations based on Korean Law.
 *
 * @protected
 * @returns {Action}
 */
export function closeConsentDialogThree() {
    return openDialog(ConsentDialogThree);
}

/**
 * 
 * Open LoginDialogDID popup
 * @protected
 * @returns{Action} 
 */
export function openLoginDialogDIDPopUp() {
    return openDialog(LoginDialogDID);
}
