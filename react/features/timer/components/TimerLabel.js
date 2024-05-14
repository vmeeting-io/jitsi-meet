// @flow

import React,{Component} from 'react';
import { connect } from 'react-redux';

import { getLocalizedDurationFormatter } from '../../base/i18n/functions';
import Label from '../../base/label/components/web/Label';
import { IconStopWatch } from '../../base/icons/svg';
import { playSound } from '../../base/sounds/actions';
import { TIMER_OFF_SOUND_ID } from '../constants';

import { _abstractMapStateToProps } from './AbstractTimerLabel';

import { notifyTimerStopped } from '../../participants-pane/actions.any'
import TimerOffGif from './TimerOffGif';


/**
 * React {@code Component} responsible for displaying a label that indicates
 * remaining timer for the currently enabled timer.
 * 
 */
export class TimerLabel extends Component {

    constructor(props) {
        super(props);

        this.state = {
            timerValue: getLocalizedDurationFormatter(0),
            className: 'custom-label'
        };

        let interval;
    }
    
    componentWillUnmount() {
        clearInterval(this.interval);
    }

    componentWillMount() {
        this.interval = setInterval(()=>{
            const dt = new Date();
            const delta = this.props.timerEndTime - dt.getTime();
            if (delta<0){
                APP.store.dispatch(playSound(TIMER_OFF_SOUND_ID));                
                // Display for timer for 10 seconds and complete the timer.
                // Display gif and audio.
                setTimeout(()=>{
                    notifyTimerStopped("TIMER_OFF");
                    this.props.displayTimerOffGif(false);
                },10000);
                
                this.props.displayTimerOffGif(true);

                this.setState({
                    timerValue: getLocalizedDurationFormatter(0),
                    className: 'custom-label-red'
                });
                clearInterval(this.interval);
                
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
        const { t } = this.props;

        return (
            <>
                <Tooltip
                    position = { 'bottom' }>
                    <div className = 'timer-label' >
                        <Label
                            className = { this.state.className}
                            icon = { IconStopWatch }
                            id = 'timerLabel'
                            text = { "Timer " + this.state.timerValue } />
                    </div>
                </Tooltip>
                
            </>
        );
    }
}


export default translate(connect(_abstractMapStateToProps)(TimerLabel));

