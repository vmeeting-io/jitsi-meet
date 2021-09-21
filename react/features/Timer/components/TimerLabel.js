// @flow

import React,{Component} from 'react';

import { getLocalizedDurationFormatter , translate } from '../../base/i18n';
import { Label } from '../../base/label';
import { IconStopWatch } from '../../base/icons';
import { connect } from '../../base/redux';
import { Tooltip } from '../../base/tooltip';

import AbstractTimerLabel, {
    _abstractMapStateToProps,
    type Props as AbstractProps
} from './AbstractTimerLabel';

import { notifyTimerStopped } from '../../participants-pane/actions.any'
import s from './TimerLabel.module.scss';

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
            timerValue: "",
            className: 'label--green',
            ended: false
        };
    }
    
    componentDidMount() {
        const interval = setInterval(()=>{
            const dt = new Date();
            const delta = this.props.timerEndTime - dt.getTime();
            if (delta<0){
                
                // Display for timer for 10 seconds and complete the timer.
                // Display gif and audio.
                setTimeout(()=>{
                    notifyTimerStopped("Completed!");
                },100000);

                this.setState({ timerValue: getLocalizedDurationFormatter(0), 
                    className: 'label--red',
                    ended: true
                    });
                clearInterval(interval);
                
            }else{
                this.setState({ timerValue: getLocalizedDurationFormatter(delta) });
            }
        },500);
    }
    
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            t
        } = this.props;

        return (
            <>
                <Tooltip
                    position = { 'bottom' }>
                    <Label
                        className = { this.state.className }
                        icon = { IconStopWatch }
                        id = 'timerLabel'
                        text = { "Timer " + this.state.timerValue } />
                </Tooltip>

                { this.state.ended && <div className={s.imgWrap} id='timer-end-clock'>
                    <img className={s.gif} src='/static/clock-buzz.gif'/>
                </div> }
            </>
        );
    }
}


export default translate(connect(_abstractMapStateToProps)(TimerLabel));

