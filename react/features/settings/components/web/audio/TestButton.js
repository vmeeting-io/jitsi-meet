// @flow

import React from 'react';

export const TEST = "Test";
export const RECORDING = "Recording...";
export const PLAYING = "Playing...";

type Props = {

    /**
     * Click handler for the button.
     */
    onClick: Function,

    /**
     * Keypress handler for the button.
     */
    onKeyPress: Function,
};

/**
 * React {@code Component} representing an button used for testing output sound.
 *
 * @returns { ReactElement}
 */
export default function TestButton({ onClick, onKeyPress, buttonText = "Test" }: Props) {
    return (
        <div
            className={buttonText === RECORDING ? 'audio-preview-test-button--recording' :
                        buttonText === PLAYING ? 'audio-preview-test-button--playing' :
                        'audio-preview-test-button'}
            onClick = { onClick }
            onKeyPress = { onKeyPress }
            role = 'button'
            tabIndex = { 0 }>
            { buttonText }
        </div>
    );
}
