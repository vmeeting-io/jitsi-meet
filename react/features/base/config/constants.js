/**
 * The prefix of the {@code localStorage} key into which {@link storeConfig}
 * stores and from which {@link restoreConfig} restores.
 *
 * @protected
 * @type string
 */
export const _CONFIG_STORE_PREFIX = 'config.js';

/**
 * The list of all possible UI buttons.
 *
 * @protected
 * @type Array<string>
 */
export const TOOLBAR_BUTTONS = [
    'camera',
    'chat',
    'closedcaptions',
    'desktop',
    'download',
    'embedmeeting',
    'whiteboard',
    'feedback',
    'filmstrip',
    'fullscreen',
    'hangup',
    'help',
    'invite',
    'livestreaming',
    'microphone',
    'mute-everyone',
    'mute-video-everyone',
    'participants',
    'profile',
    'raisehand',
    'recording',
    'security',
    'select-background',
    'settings',
    'share',
    'shareaudio',
    'sharedvideo',
    'shortcuts',
    'stats',
    'tileview',
    'toggle-camera',
    'videoquality'
];

/**
 * The toolbar buttons to show on premeeting screens.
 */
export const PREMEETING_BUTTONS = [ 'microphone', 'camera', 'select-background', 'invite', 'settings' ];

/**
  * The toolbar buttons to show on 3rdParty prejoin screen.
  */
export const THIRD_PARTY_PREJOIN_BUTTONS = [ 'microphone', 'camera', 'select-background' ];

export const DEFAULT_METAS = {
  title: '브이미팅',
  description: '브이미팅은 안전한 화상회의 서비스입니다.',
  keywords: '브이미팅, vmeeting, 화상회의, 화상 회의, 온라인 미팅, 웹 미팅, 화상 미팅, 클라우드 미팅, 클라우드 비디오, 그룹 화상 통화, 그룹 화상 채팅, 화면 공유, 데스크톱 공유, 회상 공동 작업, 그룹 메시징, 비대면 수업, 비대면 화상회의, 비대면 화상 회의, 비대면 실시간 수업',
  thumb: '/images/thumb.png',
  favicon: '/images/favicon.png'
};

/**
 * The set of feature flags.
 *
 * @enum {string}
 */

export const FEATURE_FLAGS = {
    SOURCE_NAME_SIGNALING: 'sourceNameSignaling'
};
