/**
 * The prefix of the {@code localStorage} key into which {@link storeConfig}
 * stores and from which {@link restoreConfig} restores.
 *
 * @protected
 * @type string
 */
export const _CONFIG_STORE_PREFIX = 'config.js';

/**
 * The toolbar buttons to show on premeeting screens.
 */
export const PREMEETING_BUTTONS = [ 'microphone', 'camera', 'select-background', 'invite', 'settings' ];

/**
  * The toolbar buttons to show on 3rdParty prejoin screen.
  */
export const THIRD_PARTY_PREJOIN_BUTTONS = [ 'microphone', 'camera', 'select-background' ];

/**
 * The set of feature flags.
 *
 * @enum {string}
 */

export const FEATURE_FLAGS = {
    SSRC_REWRITING: 'ssrcRewritingEnabled'
};

/**
 * The URL at which the terms (of service/use) are available to the user.
 */
export const DEFAULT_TERMS_URL = 'https://vmeeting.io/auth/page/tos';

/**
 * The URL at which the privacy policy is available to the user.
 */
export const DEFAULT_PRIVACY_URL = 'https://vmeeting.io/auth/page/privacy';

/**
 * The URL at which the help centre is available to the user.
 */
export const DEFAULT_HELP_CENTRE_URL = 'https://sites.google.com/kedutech.kr/ko-vmeeting-guide-v2/%EC%82%AC%EC%9A%A9%EC%9E%90-%EC%84%A4%EB%AA%85%EC%84%9C/%EC%9D%B4%EC%9A%A9-%EA%B0%80%EC%9D%B4%EB%93%9C-%EB%AA%A8%EB%B0%94%EC%9D%BC';
