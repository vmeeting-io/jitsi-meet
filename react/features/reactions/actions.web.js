import {
    TOGGLE_REACTIONS_VISIBLE
} from './actionTypes';

export * from './actions.any';

/**
 * Toggles the visibility of the reactions menu.
 *
 * @returns {void}
 */
export function toggleReactionsMenuVisibility() {
    return {
        type: TOGGLE_REACTIONS_VISIBLE
    };
}
