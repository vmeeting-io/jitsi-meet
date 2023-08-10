// @flow

import { toState } from '../base/redux';
import { i18next } from '../base/i18n';

declare var APP: Object;

/**
 * Determines whether the {@code WelcomePage} is enabled by the user either
 * herself or through her deployment config(uration). Not to be confused with
 * {@link isWelcomePageAppEnabled}.
 *
 * @param {Function|Object} stateful - The redux state or {@link getState}
 * function.
 * @returns {boolean} If the {@code WelcomePage} is enabled by the user, then
 * {@code true}; otherwise, {@code false}.
 */
export function isWelcomePageUserEnabled(stateful: Function | Object) {
    return (
        typeof APP === 'undefined'
            ? true
            : toState(stateful)['features/base/config'].enableWelcomePage);
}

export function getHelpLink(){
    const lang = i18next.language;
    if (lang == "ko"){
        return 'https://sites.google.com/kedutech.kr/ko-vmeeting-guide-v2/%EC%82%AC%EC%9A%A9%EC%9E%90-%EC%84%A4%EB%AA%85%EC%84%9C/%EC%9D%B4%EC%9A%A9-%EA%B0%80%EC%9D%B4%EB%93%9C-%EB%AA%A8%EB%B0%94%EC%9D%BC';
    }else{
        return 'https://sites.google.com/kedutech.kr/en-vmeeting-guide-v2/user-guide/user-guide_app';
    }
}


