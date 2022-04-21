// @flow

import { Component } from 'react';
import {
    notifyTimerStarted,
    notifyTimerStopped
} from '../actions.any';


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
     * The name of the participant who initiated the timer.
     */
    initiator: string,

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
        
        this.state = {
            min: '00',
            seconds: '00'
        };

        // Bind event handlers so they are only bound once per instance.
        this._onSubmit = this._onSubmit.bind(this);
        this._onStopped = this._onStopped.bind(this);
    }

    _onSubmit: Object => boolean;

    /**
     * Handles the submit button action.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit(duration) {
        const { dispatch, initiator } = this.props;
        duration.min = duration.min > 59 ? 59 : parseInt(duration.min);
        duration.seconds = duration.seconds > 59 ? 59 : parseInt(duration.seconds);

        var currentDateTime = new Date();
        currentDateTime.setMinutes( currentDateTime.getMinutes() + duration.min ); 
        currentDateTime.setSeconds( currentDateTime.getSeconds() + duration.seconds + 1 ); 
        const endUNIXTime = currentDateTime.getTime();

        dispatch(notifyTimerStarted(initiator,endUNIXTime));
        return true;
    }
    
    _onStopped: () => boolean;

    /**
     * Handles the cancel button action.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onStopped() {
        const { dispatch, initiator } = this.props;
        dispatch(notifyTimerStopped(initiator));
        return true;
    }
}
