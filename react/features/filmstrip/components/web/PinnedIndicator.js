/* @flow */

import React from 'react';

import { IconPinned } from '../../../base/icons';
import { BaseIndicator } from '../../../base/react';

/**
 * The type of the React {@code Component} props of {@link PinnedIndicator}.
 */
type Props = {

    /**
     * From which side of the indicator the tooltip should appear from.
     */
    tooltipPosition: string
};

/**
 * React {@code Component} for showing a pinned icon with a tooltip.
 *
 * @returns {Component}
 */
const PinnedIndicator = ({ tooltipPosition }: Props) => (
    <BaseIndicator
        icon = { IconPinned }
        iconSize = { 15 }
        tooltipKey = 'videothumbnail.pinned'
        tooltipPosition = { tooltipPosition } />
);

export default PinnedIndicator;
