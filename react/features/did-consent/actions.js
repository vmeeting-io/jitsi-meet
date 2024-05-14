// @flow

import axios from 'axios';

import tokenLocalStorage from "../../api/tokenLocalStorage";
import { getAuthUrl } from "../../api/url";

import { openDialog } from '../base/dialog/actions';
import { setJWT } from '../base/jwt/actions';
import { isAttentionAnalysisEnabled } from '../face-detect/functions';
import DIDProcessingDialog from './components/web/DIDProcessingDialog';
import LoginDialogDID from './components/web/LoginDialogDID';

import { PERMIT_DATA_REQUEST } from './actionTypes';

/**
 * 
 * Open LoginDialogDID popup
 * @protected
 * @returns{Action} 
 */
export function openLoginDialogDIDPopUp() {
    return function(dispatch, getState) {
        if (isAttentionAnalysisEnabled(getState())) {
            dispatch(openDialog(LoginDialogDID));
        }
    }
}

export function openDIDProcessingDialog(){
    return function(dispatch, getState){
        dispatch(openDialog(DIDProcessingDialog));
    }
}

export function permitDataRequest(permit) {
    return { type: PERMIT_DATA_REQUEST, permit };
}

/**
 * Save updated phone number to vmeeting database.
 * @param {Number} phoneNumber
 * @returns 
 */
export function savePhoneNumber(phoneNumber) {
    return async function (dispatch, getState) {
        const state = getState();
        const config = {
            headers: { Authorization: `Bearer ${tokenLocalStorage.getItem(state)}`},
        };
        
        const _apiBase = getAuthUrl(state);
        const { user } = state['features/base/jwt'];
        try {
            const resp = await axios.patch(`${_apiBase}/account`, { phoneNumber }, config);
            const token = resp.data;
            tokenLocalStorage.setItem(token, getState());
            dispatch(setJWT(resp.data));
        } catch(err) {
            console.log("Error while saving phonenumber ", err);
        }
    }
}
