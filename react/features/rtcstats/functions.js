// @flow

import { toState } from '../base/redux';

import RTCStats from './RTCStats';

/**
 * Checks whether rtcstats is enabled or not.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState} function.
 * @returns {boolean}
 */
export function isRTCStatsEnabled(stateful: Function | Object) {
    const state = toState(stateful);
    const { analytics } = state['features/base/config'];

    return analytics?.rtcstatsEnabled ?? false;
}
