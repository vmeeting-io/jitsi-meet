import React from 'react';

import Icon from '../../../../base/icons/components/Icon';
import { IconMeter } from '../../../../base/icons/svg';

/**
 * React {@code Component} representing an audio level meter.
 *
 * @returns { ReactElement}
 */
export default function({ className, isDisabled, level }) {
    let ownClassName;

    if (level > -1) {
        ownClassName = `metr metr-l-${level}`;
    } else {
        ownClassName = `metr ${isDisabled ? 'metr--disabled' : ''}`;
    }

    return (
        <Icon
            className = { `${ownClassName} ${className}` }
            size = { 12 }
            src = { IconMeter } />
    );
}
