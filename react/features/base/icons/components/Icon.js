import React, { useCallback } from 'react';

import { Container } from '../../react/components/index';
import { styleTypeToObject } from '../../styles/functions';

export const DEFAULT_COLOR = navigator.product === 'ReactNative' ? 'white' : undefined;
export const DEFAULT_SIZE = navigator.product === 'ReactNative' ? 36 : 22;

/**
 * Implements an Icon component that takes a loaded SVG file as prop and renders it as an icon.
 *
 * @param {IProps} props - The props of the component.
 * @returns {ReactElement}
 */
export default function Icon(props) {
    const {
        alt,
        className,
        color,
        id,
        containerId,
        onClick,
        size,
        src: IconComponent,
        style,
        ariaHasPopup,
        ariaLabel,
        ariaDisabled,
        ariaExpanded,
        ariaControls,
        tabIndex,
        ariaPressed,
        ariaDescribedBy,
        role,
        onKeyPress,
        onKeyDown,
        testId,
        ...rest
    } = props;

    const {
        color: styleColor,
        fontSize: styleSize,
        ...restStyle
    } = styleTypeToObject(style ?? {});
    const calculatedColor = color ?? styleColor ?? DEFAULT_COLOR;
    const calculatedSize = size ?? styleSize ?? DEFAULT_SIZE;

    const onKeyPressHandler = useCallback(e => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
            e.preventDefault();
            onClick(e);
        } else if (onKeyPress) {
            onKeyPress(e);
        }
    }, [ onClick, onKeyPress ]);

    const jitsiIconClassName = calculatedColor ? 'jitsi-icon' : 'jitsi-icon jitsi-icon-default';

    const iconProps = alt ? {
        'aria-label': alt,
        role: 'img'
    } : {
        'aria-hidden': true
    };

    return (
        <Container
            { ...rest }
            aria-controls = { ariaControls }
            aria-describedby = { ariaDescribedBy }
            aria-disabled = { ariaDisabled }
            aria-expanded = { ariaExpanded }
            aria-haspopup = { ariaHasPopup }
            aria-label = { ariaLabel }
            aria-pressed = { ariaPressed }
            className = { `${jitsiIconClassName} ${className || ''}` }
            data-testid = { testId }
            id = { containerId }
            onClick = { onClick }
            onKeyDown = { onKeyDown }
            onKeyPress = { onKeyPressHandler }
            role = { role }
            style = { restStyle }
            tabIndex = { tabIndex }>
            <IconComponent
                { ...iconProps }
                fill = { calculatedColor }
                height = { calculatedSize }
                id = { id }
                width = { calculatedSize } />
        </Container>
    );
}

Icon.defaultProps = {
    className: ''
};
