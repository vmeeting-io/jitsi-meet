import {
    DISABLE_KEYBOARD_SHORTCUTS,
    ENABLE_KEYBOARD_SHORTCUTS,
    REGISTER_KEYBOARD_SHORTCUT,
    OPEN_KEYBOARD_SHORTCUTS_DIALOG,
    UNREGISTER_KEYBOARD_SHORTCUT
} from './actionTypes';

/**
 * Action to register a new shortcut.
 *
 * @param {IKeyboardShortcut} shortcut - The shortcut to register.
 * @returns {AnyAction}
*/
export const registerShortcut = (shortcut) => {
    return {
        type: REGISTER_KEYBOARD_SHORTCUT,
        shortcut
    };
};

/**
* Action to unregister a shortcut.
*
* @param {string} character - The character of the shortcut to unregister.
* @param {boolean} altKey - Whether the shortcut used altKey.
* @returns {AnyAction}
*/
export const unregisterShortcut = (character: string, altKey = false) => {
    return {
        alt: altKey,
        type: UNREGISTER_KEYBOARD_SHORTCUT,
        character
    };
};

/**
 * Action to enable keyboard shortcuts.
 *
 * @returns {AnyAction}
 */
export const enableKeyboardShortcuts = () => {
    return {
        type: ENABLE_KEYBOARD_SHORTCUTS
    };
};


/**
 * Action to enable keyboard shortcuts.
 *
 * @returns {AnyAction}
 */
export const disableKeyboardShortcuts = () => {
    return {
        type: DISABLE_KEYBOARD_SHORTCUTS
    };
};
