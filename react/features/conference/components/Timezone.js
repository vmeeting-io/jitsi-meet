import React, { useCallback, useEffect, useRef, useState } from 'react';
import moment from 'moment';
import { makeStyles } from 'tss-react/mui';
import { useSelector } from 'react-redux';

import { getTimezoneOffset } from '../../timezone/functions';
import { withPixelLineHeight } from '../../base/styles/functions.web';

const useStyles = makeStyles()(theme => {
    return {
        timer: {
            ...withPixelLineHeight(theme.typography.labelRegular),
            color: theme.palette.text01,
            padding: '6px 16px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            boxSizing: 'border-box',
            height: '28px',
            borderRadius: theme.shape.borderRadius,
            marginRight: '2px',
            position: 'absolute',
            left: 20,
            top: 20,
            zIndex: 1,

            '@media (max-width: 300px)': {
                display: 'none'
            }
        }
    };
});

/**
 * Returns web element to be rendered.
 *
 * @returns {ReactElement}
 */
export default function Timezone({ useTimezone, timezone }) {
    const { classes } = useStyles();
    const interval = useRef();
    const [ timeText, setTimeText ] = useState('');
    const timezoneOffset = useSelector(getTimezoneOffset);

    /**
     * Start conference timer.
     *
     * @returns {void}
     */
    const startTimer = useCallback(() => {
        if (!interval.current && timezone) {
            interval.current = window.setInterval(() => {
                const gmtTime = moment().utcOffset(0, false).locale('en').format('hh:mm A');
                const currentTime = moment().utcOffset(0, false).utcOffset(timezoneOffset).locale('en').format('hh:mm A');
                const text = `${currentTime} (GMT: ${gmtTime})`;
                if (text !== timeText) {
                    setTimeText(text);
                }
            }, 1000);
        }
    }, [ timezoneOffset, interval ]);

    /**
     * Stop conference timer.
     *
     * @returns {void}
     */
    const stopTimer = useCallback(() => {
        if (interval.current) {
            clearInterval(interval.current);
            interval.current = undefined;
        }
    }, [ interval ]);

    useEffect(() => {
        if (!useTimezone) return;

        startTimer();

        return () => stopTimer();
    }, [ timezone, useTimezone ]);


    if (!useTimezone || !timezone) {
        return null;
    }

    return (
        <span className = { classes.timer }>{ timeText }</span>
    );
}
