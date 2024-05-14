import React from 'react';

import Icon from '../../../icons/components/Icon';
import Popover from '../../../popover/components/Popover.web';

/**
 * Displays the `ToolboxButtonWithIcon` component.
 *
 * @param {Object} props - Component's props.
 * @returns {ReactElement}
 */
export default function ToolboxButtonWithPopup(props) {
    const {
        ariaLabel,
        children,
        icon,
        iconDisabled,
        onPopoverClose,
        onPopoverOpen,
        popoverContent,
        styles,
        trigger,
        visible
    } = props;

    if (!icon) {
        return (
            <div
                className = 'settings-button-container'
                style = { styles }>
                <Popover
                    content = { popoverContent }
                    headingLabel = { ariaLabel }
                    onPopoverClose = { onPopoverClose }
                    onPopoverOpen = { onPopoverOpen }
                    position = 'top'
                    trigger = { trigger }
                    visible = { visible }>
                    {children}
                </Popover>
            </div>
        );
    }

    return (
        <div
            className = 'settings-button-container'
            style = { styles }>
            {children}
            <div className = 'settings-button-small-icon-container'>
                <Popover
                    content = { popoverContent }
                    headingLabel = { ariaLabel }
                    onPopoverClose = { onPopoverClose }
                    onPopoverOpen = { onPopoverOpen }
                    position = 'top'
                    visible = { visible }>
                    <Icon
                        alt = { ariaLabel }
                        className = { `settings-button-small-icon ${iconDisabled
                            ? 'settings-button-small-icon--disabled'
                            : ''}` }
                        size = { 16 }
                        src = { icon } />
                </Popover>
            </div>
        </div>
    );
}
