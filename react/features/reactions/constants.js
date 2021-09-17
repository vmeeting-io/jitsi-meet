// @flow

import {
    CLAP_SOUND_FILES,
    LAUGH_SOUND_FILES,
    LIKE_SOUND_FILES,
    BOO_SOUND_FILES,
    SURPRISE_SOUND_FILES,
    SILENCE_SOUND_FILES
} from './sounds';

/**
 * The payload name for the datachannel/endpoint reaction event
 */
export const ENDPOINT_REACTION_NAME = 'endpoint-reaction';

/**
 * The audio ID prefix of the audio element for which the {@link playAudio} action is
 * triggered when a new laugh reaction is received.
 *
 * @type { string }
 */
export const LAUGH_SOUND_ID = 'LAUGH_SOUND_';

/**
 * The audio ID prefix of the audio element for which the {@link playAudio} action is
 * triggered when a new clap reaction is received.
 *
 * @type {string}
 */
export const CLAP_SOUND_ID = 'CLAP_SOUND_';

/**
 * The audio ID prefix of the audio element for which the {@link playAudio} action is
 * triggered when a new like reaction is received.
 *
 * @type {string}
 */
export const LIKE_SOUND_ID = 'LIKE_SOUND_';

/**
 * The audio ID prefix of the audio element for which the {@link playAudio} action is
 * triggered when a new boo reaction is received.
 *
 * @type {string}
 */
export const BOO_SOUND_ID = 'BOO_SOUND_';

/**
 * The audio ID prefix of the audio element for which the {@link playAudio} action is
 * triggered when a new surprised reaction is received.
 *
 * @type {string}
 */
export const SURPRISE_SOUND_ID = 'SURPRISE_SOUND_';

/**
 * The audio ID prefix of the audio element for which the {@link playAudio} action is
 * triggered when a new silence reaction is received.
 *
 * @type {string}
 */
export const SILENCE_SOUND_ID = 'SILENCE_SOUND_';

/**
 * The audio ID of the audio element for which the {@link playAudio} action is
 * triggered when a new raise hand event is received.
 *
 * @type {string}
 */
export const RAISE_HAND_SOUND_ID = 'RAISE_HAND_SOUND_ID';

export type ReactionEmojiProps = {

    /**
     * Reaction to be displayed.
     */
    reaction: string,

    /**
     * Id of the reaction.
     */
    uid: number
}

export const SOUNDS_THRESHOLDS = [ 1, 4, 10 ];


export const REACTIONS = {
    like: {
        message: ':thumbs_up:',
        emoji: '👍',
        animoji: '/images/thumbs-up_1f44d.png',
        shortcutChar: 'T',
        soundId: LIKE_SOUND_ID,
        soundFiles: LIKE_SOUND_FILES
    },
    clap: {
        message: ':clap:',
        emoji: '👏',
        animoji: '/images/clapping-hands_1f44f.png',
        shortcutChar: 'C',
        soundId: CLAP_SOUND_ID,
        soundFiles: CLAP_SOUND_FILES
    },
    laugh: {
        message: ':grinning_face:',
        emoji: '😀',
        animoji: '/images/grinning-face_1f600.png',
        shortcutChar: 'L',
        soundId: LAUGH_SOUND_ID,
        soundFiles: LAUGH_SOUND_FILES
    },
    // surprised: {
    //     message: ':face_with_open_mouth:',
    //     emoji: '😮',
    //     animoji: '/images/hushed-face_1f62f.png',
    //     shortcutChar: 'O',
    //     soundId: SURPRISE_SOUND_ID,
    //     soundFiles: SURPRISE_SOUND_FILES
    // },
    boo: {
        message: ':slightly_frowning_face:',
        emoji: '🙁',
        animoji: '/images/slightly-frowning-face_1f641.png',
        shortcutChar: 'B',
        soundId: BOO_SOUND_ID,
        soundFiles: BOO_SOUND_FILES
    },
    silence: {
        message: ':shushing_face:',
        emoji: '🤫',
        animoji: '/images/shushing-face_1f92b.png',
        shortcutChar: 'S',
        soundId: SILENCE_SOUND_ID,
        soundFiles: SILENCE_SOUND_FILES
    },
    birthday: {
        message: ':partying_face:',
        emoji: '🥳',
        animoji: '/images/partying-face_1f973.png',
        shortcutChar: 'P',
        soundId: CLAP_SOUND_ID,
        soundFiles: CLAP_SOUND_FILES
    }
};
