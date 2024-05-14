// @flow

export * from './functions.any';

/**
 * Fixes the style prop that is passed to a platform generic component based on platform specific
 * format requirements.
 *
 * @param {StyleType} style - The passed style prop to the component.
 * @returns {StyleType}
 */
export function getFixedPlatformStyle(style) {
    // There is nothing to do on mobile - yet.

    return style;
}
