// @flow

import { Component } from 'react';

export type Prop = {

    /**
     * End time of the timer.
     */
    endTime: Number,

    /**
     * Flag that specifies if the timer is set or not.
     * 
     */
    timerStarted: boolean
};

/**
 * Maps (parts of) the Redux state to the associated
 * {@code AbstractTimerLabel}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _endTime: Number
 *     _timerStarted: boolean
 * }}
 */
export function _abstractMapStateToProps(state: Object) {

    return {
        timerStarted: state['features/base/conference'].timerStarted,
        endTime: state['features/base/conference'].endTime
    };
}

