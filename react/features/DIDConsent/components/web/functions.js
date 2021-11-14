import tokenLocalStorage from "../../../../api/tokenLocalStorage";
import { getAuthUrl } from "../../../../api/url";
import { showNotification } from "../../../notifications"
import axios from 'axios';
import { setJWT } from "../../../base/jwt";

/**
 * Send a Consent Disagree Notification.
 * 
 * @param {function} dispatch 
 */
export function sendConsentDisagreeNotification(dispatch){
    dispatch(showNotification({
        titleKey: 'dialog.consent.notice.disagreeTitle',
        descriptionKey: 'dialog.consent.notice.disagreeNotice',
    },
    5000))
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
    },
    5000))
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
    },
    5000))
}

/**
 * Checks phone number for the user if it exists else return false.
 * 
 * @returns Return phone number if exists in database, else return false.
 */
export async function checkPhoneNumber(){
     const state = APP.store.getState();
        const config = {
            headers: { Authorization: `Bearer ${tokenLocalStorage.getItem(state)}`}
        };
        
        const _apiBase = getAuthUrl(state);

        try {
            const resp = await axios.post(`${_apiBase}/phoneNumberExist`, config)
            return resp.data.phoneNumberExist;
        } catch(err) {
            console.log("Error on request of phoneNumberExist ", err);
            return null
        }
}

/**
 * Save updated phone number to vmeeting database.
 * @param {Number} newNumber 
 * @returns 
 */
export async function savePhoneNumber(newNumber){
    const state = APP.store.getState();
    const config = {
        headers: { Authorization: `Bearer ${tokenLocalStorage.getItem(state)}`},
        data:{
            updatedPhoneNumber: newNumber,
        }
    };
    
    const _apiBase = getAuthUrl(state);

    try {
        const resp = await axios.patch(`${_apiBase}/savePhoneNumber`, config)
        const token = resp.data;
        tokenLocalStorage.setItem(token, APP.store.getState());
        APP.store.dispatch(setJWT(resp.data));
        
        return resp;
    } catch(err) {
        console.log("Error while saving phonenumber ", err);
        return err;
    }
}

/**
 * Verify DiD consent with iconloop server.
 * 
 * @returns 
 */
export async function checkDIDConsent(){
    const state = APP.store.getState();
    const config = {
        headers: { Authorization: `Bearer ${tokenLocalStorage.getItem(state)}`}
    };
    const _apiBase = getAuthUrl(state);
    
    try{
        const response = await axios.get(`${_apiBase}/verifyConsent`, config);
        return response
    } catch(err) {
        console.log("Error while verifying consent ", err);
        return err;
    }
}