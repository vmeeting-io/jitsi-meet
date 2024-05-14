import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { getConferenceTimestamp } from '../../base/conference/functions';
import { getLocalizedDurationFormatter } from '../../base/i18n/dateUtil';

import { ConferenceTimerDisplay } from './index';

const ConferenceTimer = ({ textStyle }) => {
    const startTimestamp = useSelector(getConferenceTimestamp);
    const [ timerValue, setTimerValue ] = useState(getLocalizedDurationFormatter(0));
    const interval = useRef();

    /**
     * Sets the current state values that will be used to render the timer.
     *
     * @param {number} refValueUTC - The initial UTC timestamp value.
     * @param {number} currentValueUTC - The current UTC timestamp value.
     *
     * @returns {void}
     */
    const setStateFromUTC = useCallback((refValueUTC, currentValueUTC) => {
        if (!refValueUTC || !currentValueUTC) {
            return;
        }

        if (currentValueUTC < refValueUTC) {
            return;
        }

        const timerMsValue = currentValueUTC - refValueUTC;

        const localizedTime = getLocalizedDurationFormatter(timerMsValue);

        setTimerValue(localizedTime);
    }, []);

    /**
     * Start conference timer.
     *
     * @returns {void}
     */
    const startTimer = useCallback(() => {
        if (!interval.current && startTimestamp) {
            setStateFromUTC(startTimestamp, new Date().getTime());

            interval.current = window.setInterval(() => {
                setStateFromUTC(startTimestamp, new Date().getTime());
            }, 1000);
        }
    }, [ startTimestamp, interval ]);

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

        setTimerValue(getLocalizedDurationFormatter(0));
    }, [ interval ]);

    useEffect(() => {
        startTimer();

        return () => stopTimer();
    }, [ startTimestamp ]);


    if (!startTimestamp) {
        return null;
    }

    return (<ConferenceTimerDisplay
        textStyle = { textStyle }
        timerValue = { timerValue } />);
};

export default ConferenceTimer;
