// @flow

import { Component } from 'react';


/**
 * The type of the React {@code Component} props of
 * {@link AbstractTimerDialog}.
 */
export type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The ID of the remote participant to be muted.
     */
    timerDuration: Integer,

    /**
     * Function to translate i18n labels.
     */
    t: Function
};

/**
 * Abstract dialog for timer setting.
 *
 * @extends Component
 */
export default class AbstractTimerDialog<P:Props = Props>
    extends Component<P> {
    /**
     * Initializes a new {@code AbstractTimerDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: P) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onSubmit = this._onSubmit.bind(this);
    }

    _onSubmit: () => boolean;

    /**
     * Handles the submit button action.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        const { dispatch, timerDuration } = this.props;

        alert("_onSubmit Button Clicked. Timer Length: " + timerDuration )
        return true;
    }
}
