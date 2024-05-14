import React from 'react';

import { NOTIFY_CLICK_MODE } from '../../../../toolbox/types';
import Icon from '../../../icons/components/Icon';
import Tooltip from '../../../tooltip/components/Tooltip';

/**
 * Displays the `ToolboxButtonWithIcon` component.
 *
 * @param {Object} props - Component's props.
 * @returns {ReactElement}
 */
export default function ToolboxButtonWithIcon(props) {
    const {
        children,
        icon,
        iconDisabled,
        iconTooltip,
        buttonKey,
        notifyMode,
        onIconClick,
        onIconKeyDown,
        styles,
        ariaLabel,
        ariaHasPopup,
        ariaControls,
        ariaExpanded,
        iconId
    } = props;

    const iconProps = {};
    let className = '';

    if (iconDisabled) {
        className
            = 'settings-button-small-icon settings-button-small-icon--disabled';
    } else {
        className = 'settings-button-small-icon';
        iconProps.onClick = (e?: React.MouseEvent) => {
            if (typeof APP !== 'undefined' && notifyMode) {
                APP.API.notifyToolbarButtonClicked(
                    buttonKey, notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY
                );
            }

            if (notifyMode !== NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
                onIconClick(e);
            }
        };
        iconProps.onKeyDown = onIconKeyDown;
        iconProps.role = 'button';
        iconProps.tabIndex = 0;
        iconProps.ariaControls = ariaControls;
        iconProps.ariaExpanded = ariaExpanded;
        iconProps.containerId = iconId;
    }


    return (
        <div
            className = 'settings-button-container'
            style = { styles }>
            {children}

            <div>
                <Tooltip
                    containerClassName = { className }
                    content = { iconTooltip }
                    position = 'top'>
                    <Icon
                        { ...iconProps }
                        ariaHasPopup = { ariaHasPopup }
                        ariaLabel = { ariaLabel }
                        size = { 16 }
                        src = { icon } />
                </Tooltip>
            </div>
        </div>
    );
}
