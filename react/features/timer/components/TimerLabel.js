// @flow

import React,{Component} from 'react';

import { getLocalizedDurationFormatter , translate } from '../../base/i18n';
import { Label } from '../../base/label';
import { IconStopWatch } from '../../base/icons';
import { connect } from '../../base/redux';
import { Tooltip } from '../../base/tooltip';
import { playSound } from '../../base/sounds';
import { TIMER_OFF_SOUND_ID } from '../constants';

import AbstractTimerLabel, {
    _abstractMapStateToProps,
    type Props as AbstractProps
} from './AbstractTimerLabel';

import { notifyTimerStopped } from '../../participants-pane/actions.any'
import { TimerOffGif } from '.';

type Props = AbstractProps & {

    /**
     * The message to show within the label.
     */
    _labelKey: string,

    /**
     * The message to show within the label's tooltip.
     */
    _tooltipKey: string,

};


/**
 * React {@code Component} responsible for displaying a label that indicates
 * remaining timer for the currently enabled timer.
 * 
 */
export class TimerLabel extends Component<Props> {

    constructor(props: Props) {
        super(props);

        this.state = {
            className: 'custom-label',
            timerOffGif: false,
            timerValue: getLocalizedDurationFormatter(0),
        };
    }
    
    componentWillUnmount() {
        clearInterval(this.interval);
    }

    componentWillMount() {
        const { dispatch } = this.props;

        this.interval = setInterval(() => {
            const dt = new Date();
            const delta = this.props._timerEndTime - dt.getTime();

            if (delta < 0) {
                dispatch(playSound(TIMER_OFF_SOUND_ID));
                // Display for timer for 10 seconds and complete the timer.
                // Display gif and audio.
                setTimeout(() => {
                    dispatch(notifyTimerStopped("TIMER_OFF"));
                    this.setState({ timerOffGif: false });
                }, 10000);
                
                this.setState({
                    className: 'custom-label-red',
                    timerOffGif: true,
                    timerValue: getLocalizedDurationFormatter(0),
                });
                clearInterval(this.interval);
            } else {
                this.setState({ timerValue: getLocalizedDurationFormatter(delta) });
            }
        }, 500);
    }
    
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _timerStarted, visible } = this.props;
        let components = [];

        if (_timerStarted) {
            components.push(
                <div
                    className = {`timer-label${visible ? ' visible' : ''}`}
                    key = 'timer-label'>
                    <Label
                        className = { this.state.className }
                        icon = { IconStopWatch }
                        id = 'timerLabel'
                        text = { "Timer " + this.state.timerValue } />
                </div>
            );
        }
        if (this.state.timerOffGif) {
            components.push(<TimerOffGif key = 'timer-off-gif' />);
        }

        return components;
    }
}

export default connect(_abstractMapStateToProps)(TimerLabel);

