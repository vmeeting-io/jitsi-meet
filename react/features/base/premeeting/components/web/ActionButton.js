import React, { ReactNode, useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../icons/components/Icon';
import { IconArrowDown } from '../../../icons/svg';
import { withPixelLineHeight } from '../../../styles/functions.web';

const useStyles = makeStyles()(theme => {
    return {
        actionButton: {
            ...withPixelLineHeight(theme.typography.bodyLongBold),
            borderRadius: theme.shape.borderRadius,
            boxSizing: 'border-box',
            color: theme.palette.text01,
            cursor: 'pointer',
            display: 'inline-block',
            marginBottom: '16px',
            padding: '7px 16px',
            position: 'relative',
            textAlign: 'center',
            width: '100%',
            border: 0,

            '&.primary': {
                background: theme.palette.action01,
                color: theme.palette.text01,

                '&:hover': {
                    backgroundColor: theme.palette.action01Hover
                }
            },

            '&.secondary': {
                background: theme.palette.action02,
                color: theme.palette.text04,

                '&:hover': {
                    backgroundColor: theme.palette.action02Hover
                }
            },

            '&.text': {
                width: 'auto',
                fontSize: '13px',
                margin: '0',
                padding: '0'
            },

            '&.disabled': {
                background: theme.palette.disabled01,
                border: '1px solid #5E6D7A',
                color: '#AFB6BC',
                cursor: 'initial',

                '.icon': {
                    '& > svg': {
                        fill: '#AFB6BC'
                    }
                }
            },


            [theme.breakpoints.down(400)]: {
                fontSize: 16,
                marginBottom: 8,
                padding: '11px 16px'
            }
        },
        options: {
            borderRadius: Number(theme.shape.borderRadius) / 2,
            alignItems: 'center',
            display: 'flex',
            height: '100%',
            justifyContent: 'center',
            position: 'absolute',
            right: 0,
            top: 0,
            width: 36,

            '&:hover': {
                backgroundColor: '#0262B6'
            },

            '& svg': {
                pointerEvents: 'none'
            }
        }
    };
});

/**
 * Button used for pre meeting actions.
 *
 * @returns {ReactElement}
 */
function ActionButton({
    children,
    className = '',
    disabled,
    hasOptions,
    OptionsIcon = IconArrowDown,
    testId,
    type = 'primary',
    onClick,
    onOptionsClick,
    tabIndex,
    role,
    ariaPressed,
    ariaLabel,
    ariaDropDownLabel
}) {
    const { classes, cx } = useStyles();

    const onKeyPressHandler = useCallback(e => {
        if (onClick && !disabled && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onClick(e);
        }
    }, [ onClick, disabled ]);

    const onOptionsKeyPressHandler = useCallback(e => {
        if (onOptionsClick && !disabled && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            e.stopPropagation();
            onOptionsClick(e);
        }
    }, [ onOptionsClick, disabled ]);

    const containerClasses = cx(
        classes.actionButton,
        className && className,
        type,
        disabled && 'disabled'
    );

    return (
        <div
            aria-disabled = { disabled }
            aria-label = { ariaLabel }
            className = { containerClasses }
            data-testid = { testId ? testId : undefined }
            onClick = { disabled ? undefined : onClick }
            onKeyPress = { onKeyPressHandler }
            role = 'button'
            tabIndex = { 0 } >
            {children}
            { hasOptions
                && <div
                    aria-disabled = { disabled }
                    aria-haspopup = 'true'
                    aria-label = { ariaDropDownLabel }
                    aria-pressed = { ariaPressed }
                    className = { classes.options }
                    data-testid = 'prejoin.joinOptions'
                    onClick = { disabled ? undefined : onOptionsClick }
                    onKeyPress = { onOptionsKeyPressHandler }
                    role = { role }
                    tabIndex = { tabIndex }>
                    <Icon
                        className = 'icon'
                        size = { 24 }
                        src = { OptionsIcon } />
                </div>
            }
        </div>
    );
}

export default ActionButton;
