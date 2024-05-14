import React from 'react';

import { IconMicSlash } from '../../../base/icons/svg';
import BaseIndicator from '../../../base/react/components/web/BaseIndicator';

/**
 * React {@code Component} for showing an audio muted icon with a tooltip.
 *
 * @returns {Component}
 */
const AudioMutedIndicator = ({ tooltipPosition }) => (
    <BaseIndicator
        icon = { IconMicSlash }
        iconId = 'mic-disabled'
        iconSize = { 16 }
        id = 'audioMuted'
        tooltipKey = 'videothumbnail.mute'
        tooltipPosition = { tooltipPosition } />
);

export default AudioMutedIndicator;
