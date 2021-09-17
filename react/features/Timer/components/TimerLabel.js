// @flow

import React from 'react';

import { translate } from '../../base/i18n';
import { Label } from '../../base/label';
import { IconStopWatch } from '../../base/icons';
import { connect } from '../../base/redux';
import { Tooltip } from '../../base/tooltip';

import AbstractTimerLabel, {
    _abstractMapStateToProps,
    type Props as AbstractProps
} from './AbstractTimerLabel';

declare var interfaceConfig: Object;

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
export class TimerLabel extends AbstractTimerLabel<Props> {

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
        labelContent = "Timer 00:00"; //TODO: Remove hard-coded string. 
        tooltipKey = _tooltipKey;

        return (
            <Tooltip
                content = { t(tooltipKey) }
                position = { 'bottom' }>
                <Label
                    className = { className }
                    icon = { IconStopWatch }
                    id = 'timerLabel'
                    text = { labelContent } />
            </Tooltip>
        );
    }
}


export default translate(connect()(TimerLabel));

