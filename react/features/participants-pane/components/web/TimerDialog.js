/* @flow */

import React, { PureComponent } from 'react';

import { Dialog } from '../../../base/dialog';
import { translate, translateToHTML } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractTimerDialog from '../AbstractTimerDialog';
import { FieldTextStateless } from '@atlaskit/field-text';
import Button, { ButtonGroup } from '@atlaskit/button';
import * as s from './TimerDialog.module.scss';
import { trackNoDataFromSourceNotificationInfoChanged } from '../../../base/tracks';

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
        this.setState({ min: 0, seconds: 9 });
    }

    /**
     * Adds 30 Sec to the timer value.
     */
    _add30Sec() {

        if ((this.state.seconds + 30) > 60) {
            if (this._addMin(1)) {
                this.setState({ seconds: (parseInt(this.state.seconds) + 30) % 60 })
            }
        } else {
            this.setState({ seconds: parseInt(this.state.seconds) + 30 })
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

        if (parseInt(this.state.min) + val > 59) {
            newMinVal = 59;
            incremented = false;
        }

        this.setState({ min: newMinVal })

        return incremented
    }

    /**
     * 
     * onChange handler for Minute input.
     * @param {*} event Object
     */
    _onMinValChange(e: Object) {
        this.setState({ min: e.target.value })
    }

    /**
     * onChange handler for Second input.
     * @param {*} e 
     */
    _onSecondsValChange(e: Object) {
        this.setState({ seconds: e.target.value })
    }

    _onSubmit: string => boolean;

    /**
     * 
     * onSubmit handler.
     * @param {*} event Object 
     * @returns boolean
     */
    _onSubmitForm(e: Object) {
        const time = "{\"min\":" + this.state.min + ",\"seconds\":" + this.state.seconds + "}";
        this._onSubmit(time);
        return true;
    }

    render() {
        const { t } = this.props;
        return (
            <Dialog
                okKey='dialog.timerStart'
                onSubmit={this._onSubmitForm}
                titleKey='dialog.timerTitle'
                width='medium'>
                <div>
                    <span>
                        {t('dialog.timerBodyMessage')}
                    </span>
                    <div className={s.row}>
                        <div className={s.col}>
                            <FieldTextStateless
                                autoFocus={true}
                                className='input-control'
                                compact={true}
                                label={t('dialog.timerMin')}
                                name="durantionMinute"
                                placeholder="00"
                                min={0}
                                max={59}
                                shouldFitContainer={false}
                                type="number"
                                onChange={this._onMinValChange}
                                value={this.state.min}
                                isInvalid={this.state.min > 59}
                            />
                        </div>
                        <div className={s.col}>
                            <FieldTextStateless
                                className='input-control'
                                compact={true}
                                label={t('dialog.timerSec')}
                                name="durationSeconds"
                                placeholder="00"
                                min={0}
                                max={59}
                                shouldFitContainer={false}
                                type="number"
                                onChange={this._onSecondsValChange}
                                value={this.state.seconds}
                                isInvalid={this.state.seconds > 59}
                            />
                        </div>
                    </div>

                    <div className={s.settingHeader}>
                        <span>
                            {t('dialog.timerSimpleSetup')}
                        </span>
                    </div>

                    <div className={s.row}>
                        <div className={s.buttonGroup}>
                            <ButtonGroup>
                                <div className={s.col}>
                                    <Button
                                        onClick={this._add5Min}
                                        appearance='primary'>
                                        + 5 {t('dialog.timerMin')}
                                    </Button>
                                </div>
                                <div className={s.col}>
                                    <Button
                                        onClick={this._add3Min}
                                        appearance='primary'>
                                        + 3 {t('dialog.timerMin')}
                                    </Button>
                                </div>
                                <div className={s.col}>
                                    <Button
                                        onClick={this._add1Min}
                                        appearance='primary'>
                                        + 1 {t('dialog.timerMin')}
                                    </Button>
                                </div>
                                <div className={s.col}>
                                    <Button
                                        onClick={this._add30Sec}
                                        appearance='primary'>
                                        + 30 {t('dialog.timerSec')}
                                    </Button>
                                </div>
                                <div className={s.col}>
                                    <Button
                                        onClick={this._reset}
                                        appearance='warning'>
                                        {t('dialog.timerReset')}
                                    </Button>
                                </div>
                            </ButtonGroup>
                        </div>
                    </div>
                </div>
            </Dialog>
        );
    }
}

export default translate(connect()(TimerDialog));
