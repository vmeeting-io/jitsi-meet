/* @flow */

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import Button from '../../../base/ui/components/web/Button';
import Dialog from '../../../base/ui/components/web/Dialog';
import Input from '../../../base/ui/components/web/Input';
import { showNotification } from '../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../../notifications/constants';

import AbstractTimerDialog from '../AbstractTimerDialog';

/**
 * A React Component for setting timer duration to be set to the user.
 *
 * @extends Component
 */
class TimerDialog extends AbstractTimerDialog {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    constructor(props) {
        super(props);

        this._onMinValChange = this._onMinValChange.bind(this);
        this._onSecondsValChange = this._onSecondsValChange.bind(this);
        this._onSubmitForm = this._onSubmitForm.bind(this);
        this._add30Sec = this._add30Sec.bind(this);
        this._addMin = this._addMin.bind(this);
        this._add1Min = this._add1Min.bind(this)
        this._add3Min = this._add3Min.bind(this)
        this._add5Min = this._add5Min.bind(this)
        this._reset = this._reset.bind(this)
    }

    /**
     * 
     * Resets the timer values.
     */
    _reset() {
        this.setState({ min: '00', seconds: '00' });
    }

    /**
     * Adds 30 Sec to the timer value.
     */
    _add30Sec() {
        let newSeconds = parseInt(this.state.seconds) + 30;
        if ((newSeconds) >= 60) {
            if (this._addMin(1)) {
                let formattedNewSeconds = newSeconds % 60;
                formattedNewSeconds = (formattedNewSeconds < 10) ? `0${formattedNewSeconds}` : formattedNewSeconds;
                this.setState({ seconds: formattedNewSeconds })
            }
        } else {
            this.setState({ seconds: newSeconds })
        }
    }

    /**
     * Adds 5 minute to timer value.
     */
    _add5Min() {
        this._addMin(5);
    }

    /**
     * Adds 3 minute to timer value.
     */
    _add3Min() {
        this._addMin(3);
    }

    /**
     * Add one minute to timer value.
     */
    _add1Min() {
        this._addMin(1);
    }

    /**
     * 
     * Add {val} number of minutes to timer.
     * @param {val} no of minute to tbe added in timer value. 
     * 
     * @returns boolean
     */
    _addMin(val) {
        let incremented = true;
        let newMinVal = parseInt(this.state.min) + val;

        if (newMinVal > 59) {
            newMinVal = 59;
            incremented = false;
        }

        newMinVal = (newMinVal < 10) ? `0${newMinVal}` : newMinVal;
        this.setState({ min: newMinVal })

        return incremented
    }

    /**
     * 
     * onChange handler for Minute input.
     * @param {*} event Object
     */
    _onMinValChange(e: Object) {
        let newMinutes = e.target.value;
        newMinutes = (newMinutes > 59) ? 59 : newMinutes
        newMinutes = (newMinutes < 0) ? 0 : newMinutes;
        this.setState({ min: newMinutes })
    }

    /**
     * onChange handler for Second input.
     * @param {*} e 
     */
    _onSecondsValChange(e: Object) {
        let newSeconds = e.target.value;
        newSeconds = (newSeconds > 59) ? 59 : newSeconds;
        newSeconds = (newSeconds < 0) ? 0 : newSeconds;
        this.setState({ seconds: newSeconds })
    }

    _onSubmit: Object => boolean;

    /**
     * 
     * onSubmit handler.
     * @param {*} event Object 
     * @returns boolean
     */
    _onSubmitForm(e: Object) {
        const { dispatch, t } = this.props;
        const time = {"min":  parseInt(this.state.min) ,
                      "seconds": parseInt(this.state.seconds) };
        if ((time.min === 0) && (time.seconds === 0)) {
            dispatch(showNotification({
                descriptionKey: t('notify.invalidTimerDescription'),
                titleKey: t('notify.invalidTimer'),
            }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        } else {
            this._onSubmit(time);
            return true;
        }
        
    }

    render() {
        const { t } = this.props;
        return (
            <Dialog
                okKey='dialog.timerStart'
                onSubmit={this._onSubmitForm}
                titleKey='dialog.timerTitle'
                width='small'>
                <div className = 'timer-dialog'>
                    <span>
                        {t('dialog.timerBodyMessage')}
                    </span>
                    <div className='row'>
                        <div className='col'>
                        </div>
                        <div className='col'>
                            <Input
                                autoFocus={true}
                                className='input-control'
                                label={t('dialog.timerMin')}
                                name="durantionMinute"
                                onChange={this._onMinValChange}
                                placeholder="00"
                                type="number"
                                value={this.state.min}
                                // isInvalid={parseInt(this.state.min) > 60}
                            />
                        </div>
                        <div className='col'>
                            <Input
                                className='input-control'
                                label={t('dialog.timerSec')}
                                name="durationSeconds"
                                onChange={this._onSecondsValChange}
                                placeholder="00"
                                type="number"
                                value={this.state.seconds}
                                // isInvalid={this.state.seconds > 59}
                            />
                        </div>
                        <div className='col reset-button-container'>
                            <div className='reset-button'>
                                <Button
                                    onClick={this._reset}
                                    appearance='warning'>
                                    {t('dialog.timerReset')}
                                </Button>
                            </div>
                        </div>
                        <div className='col'>
                        </div>
                    </div>

                    <div className='setting-header'>
                        <span>
                            {t('dialog.timerSimpleSetup')}
                        </span>
                    </div>

                    <div className='row'>
                        <div className='button-group'>
                            <div className = { 'buttons-container' }>
                                <div className='col'>
                                    <Button
                                        onClick={this._add5Min}
                                        appearance='primary'>
                                        + 5 {t('dialog.timerMin')}
                                    </Button>
                                </div>
                                <div className='col'>
                                    <Button
                                        onClick={this._add3Min}
                                        appearance='primary'>
                                        + 3 {t('dialog.timerMin')}
                                    </Button>
                                </div>
                                <div className='col'>
                                    <Button
                                        onClick={this._add1Min}
                                        appearance='primary'>
                                        + 1 {t('dialog.timerMin')}
                                    </Button>
                                </div>
                                <div className='coll'>
                                    <Button
                                        onClick={this._add30Sec}
                                        appearance='primary'>
                                        + 30 {t('dialog.timerSec')}
                                    </Button>
                                </div>
                               
                            </div>
                        </div>
                    </div>
                </div>
            </Dialog>
        );
    }
}

export default translate(connect()(TimerDialog));
