import tokenLocalStorage from "../../../../api/tokenLocalStorage";
import { getAuthUrl } from "../../../../api/url";
import { showNotification } from "../../../notifications"
import axios from 'axios';
import { setJWT } from "../../../base/jwt";

export function sendConsentDisagreeNotification(dispatch){
    dispatch(showNotification({
        titleKey: 'dialog.consent.notice.disagreeTitle',
        descriptionKey: 'dialog.consent.notice.disagreeNotice',
    },
    5000))
}

export function sendConsentAgreeNotification(dispatch){
    dispatch(showNotification({
        titleKey: 'dialog.consent.notice.agreeTitle',
        descriptionKey: 'dialog.consent.notice.agreeNotice',
    },
    5000))
}

export function sendConsentVerifyOnProgressNotification(dispatch){
    dispatch(showNotification({
        titleKey: 'dialog.consent.notice.agreeTitle',
        descriptionKey: 'dialog.consent.notice.verificationOnProcess',
    },
    5000))
}

export async function checkPhoneNumber(){
     const state = APP.store.getState();
        const config = {
            headers: { Authorization: `Bearer ${tokenLocalStorage.getItem(state)}`}
        };
        
        const _apiBase = getAuthUrl(state);

        try {
            const resp = await axios.get(`${_apiBase}/phoneNumberExist`, config)
            return resp.data.phoneNumberExist;
        } catch(err) {
            console.log("vmchg: Error on request of phoneNumberExist ", err);
            return null
        }
}


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
            console.log("vmchg: Error while saving phonenumber ", err);
            return err;
        }
}

export async function checkDIDConsent(){
    const state = APP.store.getState();
    const config = {
        headers: { Authorization: `Bearer ${tokenLocalStorage.getItem(state)}`}
    };
    const _apiBase = getAuthUrl(state);
    
    try{
        const response = await axios.get(`${_apiBase}/verifyConsent`, config);
        // console.log("vmchg: checkDIDConsent ",response)
        return response
    } catch(err) {
        console.log("vmchg: Error while saving phonenumber ", err);
        return err;
    }
}