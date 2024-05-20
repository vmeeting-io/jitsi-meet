// @flow

import { hasAvailableDevices } from '../base/devices/functions';
import { MEET_FEATURES } from '../base/jwt/constants';
import { isJwtFeatureEnabled } from '../base/jwt/functions';
import { IGUMPendingState } from '../base/media/types';
import ChatButton from '../chat/components/web/ChatButton';
import FeedbackButton from '../feedback/components/FeedbackButton.web';
import KeyboardShortcutsButton from '../keyboard-shortcuts/components/web/KeyboardShortcutsButton';
import ParticipantsPaneButton from '../participants-pane/components/web/ParticipantsPaneButton';
import RaiseHandContainerButton from '../reactions/components/web/RaiseHandContainerButtons';
import ReactionsMenuButton from '../reactions/components/web/ReactionsMenuButton';
import LiveStreamButton from '../recording/components/LiveStream/web/LiveStreamButton';
import RecordButton from '../recording/components/Recording/web/RecordButton';
import ShareAudioButton from '../screen-share/components/web/ShareAudioButton';
import { isScreenMediaShared } from '../screen-share/functions';
import STTDialogButton from '../speech-to-text/components/STTDialogButton';

import SecurityDialogButton from '../security/components/security-dialog/web/SecurityDialogButton';
import SettingsButton from '../settings/components/web/SettingsButton';
import SharedVideoButton from '../shared-video/components/web/SharedVideoButton';
import ClosedCaptionButton from '../subtitles/components/web/ClosedCaptionButton';
import TileViewButton from '../video-layout/components/TileViewButton';
import VideoBackgroundButton from '../virtual-background/components/VideoBackgroundButton';
// import VirtualAvatarButton from '../virtual-avatar/components/VirtualAvatarButton';
import { isWhiteboardVisible } from '../whiteboard/functions';

import DownloadButton from './components/DownloadButton';
import HelpButton from './components/HelpButton';
import AudioSettingsButton from './components/web/AudioSettingsButton';
import FullscreenButton from './components/web/FullscreenButton';
import ShareMenuButton from './components/web/ShareMenuButton';
import ShareDesktopButton from './components/web/ShareDesktopButton';
import ToggleCameraButton from './components/web/ToggleCameraButton';
import VideoSettingsButton from './components/web/VideoSettingsButton';
import { TOOLBAR_TIMEOUT } from './constants';

export * from './functions.any';

/**
 * Helper for getting the height of the toolbox.
 *
 * @returns {number} The height of the toolbox.
 */
export function getToolboxHeight() {
    const toolbox = document.getElementById('new-toolbox');

    return toolbox?.clientHeight || 0;
}

/**
 * Checks if the specified button is enabled.
 *
 * @param {string} buttonName - The name of the button. See {@link interfaceConfig}.
 * @param {Object|Array<string>} state - The redux state or the array with the enabled buttons.
 * @returns {boolean} - True if the button is enabled and false otherwise.
 */
export function isButtonEnabled(buttonName: string, state: Object) {
    const buttons = Array.isArray(state) ? state : state['features/toolbox'].toolbarButtons || [];

    return buttons.includes(buttonName);
}

/**
 * Indicates if the toolbox is visible or not.
 *
 * @param {Object} state - The state from the Redux store.
 * @returns {boolean} - True to indicate that the toolbox is visible, false -
 * otherwise.
 */
export function isToolboxVisible(state: Object) {
    const { iAmRecorder, iAmSipGateway, toolbarConfig } = state['features/base/config'];
    const { alwaysVisible } = toolbarConfig || {};
    const {
        timer,
        visible
    } = state['features/toolbox'];
    const { audioSettingsVisible, videoSettingsVisible } = state['features/settings'];
    const whiteboardVisible = isWhiteboardVisible(state);

    return Boolean(!iAmRecorder && !iAmSipGateway
            && (
                timer
                || visible
                || alwaysVisible
                || audioSettingsVisible
                || videoSettingsVisible
                || whiteboardVisible
            ));
}

/**
 * Indicates if the audio settings button is disabled or not.
 *
 * @param {Object} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isAudioSettingsButtonDisabled(state: Object) {

    return !(hasAvailableDevices(state, 'audioInput')
        || hasAvailableDevices(state, 'audioOutput'))
        || state['features/base/config'].startSilent;
}

/**
 * Indicates if the desktop share button is disabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isDesktopShareButtonDisabled(state: Object) {
    const { muted, unmuteBlocked } = state['features/base/media'].video;
    const videoOrShareInProgress = !muted || isScreenMediaShared(state);
    const enabledInJwt = isJwtFeatureEnabled(state, MEET_FEATURES.SCREEN_SHARING, true, true);

    return !enabledInJwt || (unmuteBlocked && !videoOrShareInProgress);
}

/**
 * Indicates if the video settings button is disabled or not.
 *
 * @param {Object} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isVideoSettingsButtonDisabled(state: Object) {
    return !hasAvailableDevices(state, 'videoInput');
}

/**
 * Indicates if the video mute button is disabled or not.
 *
 * @param {Object} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isVideoMuteButtonDisabled(state: Object) {
    const { muted, unmuteBlocked, gumPending } = state['features/base/media'].video;

    return !hasAvailableDevices(state, 'videoInput')
        || (unmuteBlocked && Boolean(muted))
        || gumPending !== IGUMPendingState.NONE;
}

/**
 * If an overflow drawer should be displayed or not.
 * This is usually done for mobile devices or on narrow screens.
 *
 * @param {Object} state - The state from the Redux store.
 * @returns {boolean}
 */
export function showOverflowDrawer(state: Object) {
    return state['features/toolbox'].overflowDrawer;
}

/**
 * Returns true if the overflow menu button is displayed and false otherwise.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean} - True if the overflow menu button is displayed and false otherwise.
 */
export function showOverflowMenu(state: Object) {
    return state['features/toolbox'].overflowMenuVisible;
}

/**
 * Indicates whether the toolbox is enabled or not.
 *
 * @param {Object} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isToolboxEnabled(state: Object) {
    return state['features/toolbox'].enabled;
}

/**
 * Returns the toolbar timeout from config or the default value.
 *
 * @param {Object} state - The state from the Redux store.
 * @returns {number} - Toolbar timeout in milliseconds.
 */
export function getToolbarTimeout(state: Object) {
    const { toolbarConfig } = state['features/base/config'];

    return toolbarConfig?.timeout || TOOLBAR_TIMEOUT;
}

/**
    * Returns all buttons that could be rendered.
    *
    * @param {Object} _customToolbarButtons - An array containing custom buttons objects.
    * @returns {Object} The button maps mainMenuButtons and overflowMenuButtons.
    */
export function getAllToolboxButtons(_customToolbarButtons) {

    const microphone = {
        key: 'microphone',
        Content: AudioSettingsButton,
        group: 0
    };

    const camera = {
        key: 'camera',
        Content: VideoSettingsButton,
        group: 0
    };

    const chat = {
        key: 'chat',
        Content: ChatButton,
        group: 2
    };

    const share = {
        key: 'share',
        Content: ShareMenuButton,
        group: 2
    };

    const desktop = {
        key: 'desktop',
        Content: ShareDesktopButton,
        group: 2
    };

    // In Narrow layout and mobile web we are using drawer for popups and that is why it is better to include
    // all forms of reactions in the overflow menu. Otherwise the toolbox will be hidden and the reactions popup
    // misaligned.
    const raisehand = {
        key: 'raisehand',
        Content: RaiseHandContainerButton,
        group: 2
    };

    const reactions = {
        key: 'reactions',
        Content: ReactionsMenuButton,
        group: 2
    };

    const participants = {
        key: 'participants',
        Content: ParticipantsPaneButton,
        group: 2
    };

    const tileview = {
        key: 'tileview',
        Content: TileViewButton,
        group: 2
    };

    const toggleCamera = {
        key: 'toggle-camera',
        Content: ToggleCameraButton,
        group: 2
    };

    const fullscreen = {
        key: 'fullscreen',
        Content: FullscreenButton,
        group: 2
    };

    const security = {
        key: 'security',
        alias: 'info',
        Content: SecurityDialogButton,
        group: 2
    };

    const cc = {
        key: 'closedcaptions',
        Content: ClosedCaptionButton,
        group: 2
    };

    const stt = {
        key: 'stt',
        Content: STTDialogButton,
        group: 2
    }

    const recording = {
        key: 'recording',
        Content: RecordButton,
        group: 2
    };

    const livestreaming = {
        key: 'livestreaming',
        Content: LiveStreamButton,
        group: 2
    };

    const shareVideo = {
        key: 'sharedvideo',
        Content: SharedVideoButton,
        group: 3
    };

    const shareAudio = {
        key: 'shareaudio',
        Content: ShareAudioButton,
        group: 3
    };

    const virtualBackground = {
        key: 'select-background',
        Content: VideoBackgroundButton,
        group: 3
    };

    // const virtualAvatar = {
    //     key: 'select-virtual-avatar',
    //     Content: VirtualAvatarButton,
    //     group: 3
    // };

    const settings = {
        key: 'settings',
        Content: SettingsButton,
        group: 4
    };

    const shortcuts = {
        key: 'shortcuts',
        Content: KeyboardShortcutsButton,
        group: 4
    };

    // const feedback = {
    //     key: 'feedback',
    //     Content: FeedbackButton,
    //     group: 4
    // };

    const download = {
        key: 'download',
        Content: DownloadButton,
        group: 4
    };

    const help = {
        key: 'help',
        Content: HelpButton,
        group: 4
    };

    const customButtons = _customToolbarButtons?.reduce((prev, { backgroundColor, icon, id, text }) => {
        return {
            ...prev,
            [id]: {
                backgroundColor,
                key: id,
                Content: CustomOptionButton,
                group: 4,
                icon,
                text
            }
        };
    }, {});

    return {
        microphone,
        camera,
        share,
        desktop,
        chat,
        raisehand,
        reactions,
        participants,
        tileview,
        toggleCamera,
        fullscreen,
        security,
        cc,
        stt,
        recording,
        livestreaming,
        shareVideo,
        shareAudio,
        virtualBackground,
        // virtualAvatar,
        settings,
        shortcuts,
        // feedback,
        download,
        help,
        ...customButtons
    };
}

/**
 * Returns the list of participant menu buttons that have that notify the api when clicked.
 *
 * @param {Object} state - The redux state.
 * @returns {Map<string, NOTIFY_CLICK_MODE>} - The list of participant menu buttons.
 */
export function getParticipantMenuButtonsWithNotifyClick(state: Object) {
    return state['features/toolbox'].participantMenuButtonsWithNotifyClick;
}
