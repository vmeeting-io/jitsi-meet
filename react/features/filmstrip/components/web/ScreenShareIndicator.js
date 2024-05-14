import React from 'react';

import { IconScreenshare } from '../../../base/icons/svg';
import BaseIndicator from '../../../base/react/components/web/BaseIndicator';

/**
 * React {@code Component} for showing a screen-sharing icon with a tooltip.
 *
 * @param {IProps} props - React props passed to this component.
 * @returns {React$Element<any>}
 */
export default function ScreenShareIndicator(props) {
    return (
        <BaseIndicator
            icon = { IconScreenshare }
            iconId = 'share-desktop'
            iconSize = { 16 }
            tooltipKey = 'videothumbnail.screenSharing'
            tooltipPosition = { props.tooltipPosition } />
    );
}
