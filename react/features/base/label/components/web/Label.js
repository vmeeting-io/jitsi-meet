import React, { useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../icons/components/Icon';
import { withPixelLineHeight } from '../../../styles/functions.web';
import { COLORS } from '../../constants';

const useStyles = makeStyles()(theme => {
    return {
        label: {
            ...withPixelLineHeight(theme.typography.labelRegular),
            alignItems: 'center',
            background: theme.palette.ui04,
            borderRadius: '4px',
            color: theme.palette.text01,
            display: 'flex',
            margin: '0 2px',
            padding: '6px',
            height: 28,
            boxSizing: 'border-box'
        },
        withIcon: {
            marginLeft: 8
        },
        clickable: {
            cursor: 'pointer'
        },
        [COLORS.white]: {
            background: theme.palette.ui09,
            color: theme.palette.text04,

            '& svg': {
                fill: theme.palette.icon04
            }
        },
        [COLORS.green]: {
            background: theme.palette.success02
        },
        [COLORS.red]: {
            background: theme.palette.actionDanger
        }
    };
});

const Label = ({
    accessibilityText,
    className,
    color,
    icon,
    iconColor,
    id,
    onClick,
    text
}) => {
    const { classes, cx } = useStyles();

    const onKeyPress = useCallback(event => {
        if (!onClick) {
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
        }
    }, [ onClick ]);

    return (
        <div
            className = { cx(classes.label, onClick && classes.clickable,
                color && classes[color], className
            ) }
            id = { id }
            onClick = { onClick }
            onKeyPress = { onKeyPress }
            role = { onClick ? 'button' : undefined }
            tabIndex = { onClick ? 0 : undefined }>
            {icon && <Icon
                color = { iconColor }
                size = '16'
                src = { icon } />}
            {accessibilityText && <span className = 'sr-only'>{accessibilityText}</span>}
            {text && <span className = { icon && classes.withIcon }>{text}</span>}
        </div>
    );
};

export default Label;
