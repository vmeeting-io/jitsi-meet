// @flow

import { Component } from 'react';

export type Prop = {

    /**
     * Whether or not the conference is in audio only mode.
     */
    _audioOnly: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Abstract class for the {@code TimerLabel} component.
 */
export default class AbstractTimerLabel<P: Props> extends Component<P> {

}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code AbstractTimerLabel}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean
 * }}
 */
export function _abstractMapStateToProps(state: Object) {
    const { enabled: audioOnly } = state['features/base/audio-only'];

    return {
        _audioOnly: audioOnly
    };
}

