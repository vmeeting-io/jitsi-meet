import React from 'react';

import { IconModerator } from '../../../base/icons/svg';
import BaseIndicator from '../../../base/react/components/web/BaseIndicator';

/**
 * React {@code Component} for showing a moderator icon with a tooltip.
 *
 * @returns {JSX.Element}
 */
const ModeratorIndicator = ({ tooltipPosition }) => (
    <BaseIndicator
        icon = { IconModerator }
        iconSize = { 16 }
        tooltipKey = 'videothumbnail.moderator'
        tooltipPosition = { tooltipPosition } />
);

export default ModeratorIndicator;
