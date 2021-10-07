// @flow

export const REACTIONS = {
    like: {
        message: ':thumbs_up:',
        emoji: '👍',
        animoji: require('../../../images/thumbs-up_1f44d.png'),
        shortcutChar: 'T'
    },
    clap: {
        message: ':clap:',
        emoji: '👏',
        animoji: require('../../../images/clapping-hands_1f44f.png'),
        shortcutChar: 'C'
    },
    laugh: {
        message: ':grinning_face:',
        emoji: '😀',
        animoji: require('../../../images/grinning-face_1f600.png'),
        shortcutChar: 'L'
    },
    surprised: {
        message: ':face_with_open_mouth:',
        emoji: '😮',
        animoji: require('../../../images/grinning-face_1f600.png'),
        shortcutChar: 'O'
    },
    boo: {
        message: ':slightly_frowning_face:',
        emoji: '🙁',
        animoji: require('../../../images/slightly-frowning-face_1f641.png'),
        shortcutChar: 'B'
    },
    party: {
        message: ':party_popper:',
        emoji: '🎉',
        animoji: require('../../../images/partying-face_1f973.png'),
        shortcutChar: 'P'
    },
    silence: {
        message: ':shushing_face:',
        emoji:  '🤫',
        animoji: require('../../../images/shushing-face_1f92b.png'),
        shortcutChar: 'S'
    },
    birthday: {
        message: ':partying_face:',
        emoji: '🥳',
        animoji: require('../../../images/partying-face_1f973.png'),
        shortcutChar: 'P'
    }
};

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
