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
            className: 'label--green'
        };
    }
    
    _startTimer(endTime) {
       
        setTimeout(()=>{
            const dt = new Date();
            const delta = endTime - dt.getTime();
            this.setState({ timerValue: getLocalizedDurationFormatter(delta) });
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
            _labelKey,
            _tooltipKey,
            t
        } = this.props;

        let className, labelContent, tooltipKey;

        className = 'label--green'; //TODO: Make it blinking based on remaining time.
        labelContent = t(_labelKey);
        const endTime = this.props.endTime;
        
        const dt = new Date();
        labelContent = getLocalizedDurationFormatter(endTime - dt.getTime()); 
        this._startTimer(this.props.endTime);
        tooltipKey = _tooltipKey;

        return (
            this.props.timerStarted!= undefined && this.props.timerStarted && <Tooltip
                content = { t(tooltipKey) }
                position = { 'bottom' }>
                <Label
                    className = { this.state.className }
                    icon = { IconStopWatch }
                    id = 'timerLabel'
                    text = { "Timer " + this.state.timerValue } />
            </Tooltip>
        );
    }
}


export default translate(connect(_abstractMapStateToProps)(TimerLabel));

