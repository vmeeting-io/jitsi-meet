import axios from 'axios';

import tokenLocalStorage from "../../api/tokenLocalStorage";
import { getAuthUrl } from "../../api/url";
import { NOTIFICATION_TIMEOUT_TYPE, showNotification } from "../notifications"

/**
 * Send a Consent Disagree Notification.
 * 
 * @param {function} dispatch 
 */
export function sendConsentDisagreeNotification(dispatch){
    dispatch(showNotification({
        titleKey: 'dialog.consent.notice.disagreeTitle',
        descriptionKey: 'dialog.consent.notice.disagreeNotice',
    }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM))
}

/**
 * Send a Consent Agree Notification.
 * 
 * @param {function} dispatch 
 */
export function sendConsentAgreeNotification(dispatch){
    dispatch(showNotification({
        titleKey: 'dialog.consent.notice.agreeTitle',
        descriptionKey: 'dialog.consent.notice.agreeNotice',
    }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM))
}

/**
 * Send a Verify on Progress(meaning yet to be verified via zzeung app) Notification.
 * 
 * @param {function} dispatch 
 */

export function sendConsentVerifyOnProgressNotification(dispatch){
    dispatch(showNotification({
        titleKey: 'dialog.consent.notice.agreeTitle',
        descriptionKey: 'dialog.consent.notice.verificationOnProcess',
    }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM))
}

/**
 * Verify DiD consent with iconloop server.
 * 
 * @returns 
 */
export async function checkDIDConsent(){
    const state = APP.store.getState();
    const config = {
        headers: { Authorization: `Bearer ${tokenLocalStorage.getItem(state)}`},
        timeout: 2000,
    };
    const _apiBase = getAuthUrl(state);
    
    try {
        const response = await axios.get(`${_apiBase}/verifyConsent`, config);
        return response;
    } catch(err) {
        console.log("Error while verifying consent ", err.message);
        return err;
    }
}

export function isDIDPermitted(state) {
    return state['features/did-consent'].permit;
}
