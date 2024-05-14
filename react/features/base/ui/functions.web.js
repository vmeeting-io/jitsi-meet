// @flow

import { adaptV4Theme, createTheme } from '@mui/material/styles';

import { createColorTokens } from './utils';

/**
 * Creates a MUI theme based on local UI tokens.
 *
 * @param {Object} arg - The ui tokens.
 * @returns {Object}
 */
export function createWebTheme({ font, colors, colorMap, shape, spacing, typography, breakpoints }: Object) {
    return createTheme(adaptV4Theme({
        spacing,
        palette: createColorTokens(colorMap, colors),
        shape,
        typography: {
            font,
            ...typography
        },
        breakpoints
    }));
}

/**
 * Find the first styled ancestor component of an element.
 *
 * @param {HTMLElement|null} target - Element to look up.
 * @param {string} cssClass - Styled component reference.
 * @returns {HTMLElement|null} Ancestor.
 */
export const findAncestorByClass = (target: HTMLElement | null, cssClass: string): HTMLElement | null => {
    if (!target || target.classList.contains(cssClass)) {
        return target;
    }

    return findAncestorByClass(target.parentElement, cssClass);
};

/**
 * Checks if the passed element is visible in the viewport.
 *
 * @param {Element} element - The element.
 * @returns {boolean}
 */
export function isElementInTheViewport(element?: Element): boolean {
    if (!element) {
        return false;
    }

    if (!document.body.contains(element)) {
        return false;
    }

    const { innerHeight, innerWidth } = window;
    const { bottom, left, right, top } = element.getBoundingClientRect();

    if (bottom <= innerHeight && top >= 0 && left >= 0 && right <= innerWidth) {
        return true;
    }

    return false;
}

const enterKeyElements = [ 'select', 'textarea', 'summary', 'a' ];

/**
 * Informs whether or not the given element does something on its own when pressing the Enter key.
 *
 * This is useful to correctly submit custom made "forms" that are not using the native form element,
 * only when the user is not using an element that needs the enter key to work.
 * Note the implementation is incomplete and should be updated as needed if more complex use cases arise
 * (for example, the Tabs aria pattern is not handled).
 *
 * @param {Element} element - The element.
 * @returns {boolean}
 */
export function operatesWithEnterKey(element: Element): boolean {
    if (enterKeyElements.includes(element.tagName.toLowerCase())) {
        return true;
    }

    if (element.tagName.toLowerCase() === 'button' && element.getAttribute('role') === 'button') {
        return true;
    }

    return false;
}
