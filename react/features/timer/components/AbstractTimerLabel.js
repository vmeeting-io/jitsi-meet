// @flow

import { Component } from 'react';

export type Prop = {

    /**
     * End time of the timer.
     */
    timerEndTime: Number,

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
 *     _timerEndTime: Number
 *     _timerStarted: boolean
 * }}
 */
export function _abstractMapStateToProps(state: Object) {
    const { timerStarted, timerEndTime } = state['features/base/conference'];

    return {
        _timerEndTime: timerEndTime,
        _timerStarted: timerStarted,
    };
}

