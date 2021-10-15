import { i18next } from '../../base/i18n';

export function getHelpLink(language="ko"){
    const lang = i18next.language;
    if (lang == "ko"){
        return 'https://sites.google.com/kedutech.kr/ko-vmeeting-guide-v2/%EC%82%AC%EC%9A%A9%EC%9E%90-%EC%84%A4%EB%AA%85%EC%84%9C/%EC%9D%B4%EC%9A%A9-%EA%B0%80%EC%9D%B4%EB%93%9C-%EB%AA%A8%EB%B0%94%EC%9D%BC';
    }else{
        return 'https://sites.google.com/kedutech.kr/en-vmeeting-guide-v2/user-guide/user-guide_app';
    }
}