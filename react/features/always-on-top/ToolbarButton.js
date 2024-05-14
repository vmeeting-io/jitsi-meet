import React, { useCallback } from 'react';

import Icon from '../base/icons/components/Icon';

const ToolbarButton = ({
    accessibilityLabel,
    customClass,
    disabled = false,
    onClick,
    icon,
    toggled = false
}) => {
    const onKeyPress = useCallback(event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
        }
    }, [ onClick ]);

    return (<div
        aria-disabled = { disabled }
        aria-label = { accessibilityLabel }
        aria-pressed = { toggled }
        className = { `toolbox-button ${disabled ? ' disabled' : ''}` }
        onClick = { disabled ? undefined : onClick }
        onKeyPress = { disabled ? undefined : onKeyPress }
        role = 'button'
        tabIndex = { 0 }>
        <div className = { `toolbox-icon ${disabled ? 'disabled' : ''} ${customClass ?? ''}` }>
            <Icon src = { icon } />
        </div>
    </div>);
};

export default ToolbarButton;
