// @flow

/* eslint-disable no-unused-vars */

import React from 'react';

/**
 * Returns web element to be rendered.
 *
 * @param {string} timerValue - String to display as time.
 * @param {string} textStyle - timer text style.
 *
 * @returns {ReactElement}
 */
export default function renderConferenceTimer(timerValue: string, textStyle: Any) {
    return (
        <span className = { textStyle }>
            { timerValue }
        </span>
    );
}
