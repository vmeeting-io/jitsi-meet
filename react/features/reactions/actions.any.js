// @flow

import {
    ADD_REACTION_BUFFER,
    ADD_REACTION_MESSAGE,
    FLUSH_REACTION_BUFFER,
    PUSH_REACTIONS,
    SEND_REACTIONS,
    SET_REACTION_QUEUE,
    SHOW_SOUNDS_NOTIFICATION
} from './actionTypes';
import { type ReactionEmojiProps } from './constants';

/**
 * Sets the reaction queue.
 *
 * @param {Array} value - The new queue.
 * @returns {Function}
 */
export function setReactionQueue(queue: Array<ReactionEmojiProps>) {
    return {
        type: SET_REACTION_QUEUE,
        queue
    };
}


/**
 * Removes a reaction from the queue.
 *
 * @param {number} uid - Id of the reaction to be removed.
 * @returns {void}
 */
export function removeReaction(uid: number) {
    return (dispatch: Function, getState: Function) => {
        const queue = getState()['features/reactions'].queue;

        dispatch(setReactionQueue(queue.filter(reaction => reaction.uid !== uid)));
    };
}


/**
 * Sends the reactions buffer to everyone in the conference.
 *
 * @returns {IReactionsAction}
 */
export function sendReactions() {
    return {
        type: SEND_REACTIONS
    };
}

/**
 * Adds a reaction to the local buffer.
 *
 * @param {string} reaction - The reaction to be added.
 * @returns {IReactionsAction}
 */
export function addReactionToBuffer(reaction: string) {
    return {
        type: ADD_REACTION_BUFFER,
        reaction
    };
}

/**
 * Clears the reaction buffer.
 *
 * @returns {IReactionsAction}
 */
export function flushReactionBuffer() {
    return {
        type: FLUSH_REACTION_BUFFER
    };
}

/**
 * Adds a reaction message to the chat.
 *
 * @param {string} message - The reaction message.
 * @returns {IReactionsAction}
 */
export function addReactionsToChat(message: string) {
    return {
        type: ADD_REACTION_MESSAGE,
        message
    };
}

/**
 * Adds reactions to the animation queue.
 *
 * @param {Array} reactions - The reactions to be animated.
 * @returns {IReactionsAction}
 */
export function pushReactions(reactions: Array<string>) {
    return {
        type: PUSH_REACTIONS,
        reactions
    };
}

/**
 * Displays the disable sounds notification.
 *
 * @returns {void}
 */
export function displayReactionSoundsNotification() {
    return {
        type: SHOW_SOUNDS_NOTIFICATION
    };
}
