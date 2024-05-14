import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { translate } from '../../../i18n/functions';
import Icon from '../../../icons/components/Icon';
import Tooltip from '../../../tooltip/components/Tooltip';

const useStyles = makeStyles()(() => {
    return {
        indicator: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }
    };
});

/**
 * React {@code Component} for showing an icon with a tooltip.
 *
 * @returns {ReactElement}
 */
const BaseIndicator = ({
    className = '',
    icon,
    iconClassName,
    iconColor,
    iconId,
    iconSize,
    id = '',
    t,
    tooltipKey,
    tooltipPosition = 'top'
}) => {
    const { classes: styles } = useStyles();
    const style = {};

    if (iconSize) {
        style.fontSize = iconSize;
    }

    return (
        <div className = { styles.indicator }>
            <Tooltip
                content = { t(tooltipKey) }
                position = { tooltipPosition }>
                <span
                    className = { className }
                    id = { id }>
                    <Icon
                        alt = { t(tooltipKey) }
                        className = { iconClassName }
                        color = { iconColor }
                        id = { iconId }
                        src = { icon }
                        style = { style } />
                </span>
            </Tooltip>
        </div>
    );
};

export default translate(BaseIndicator);
