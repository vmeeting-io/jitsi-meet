/* @flow */

import React, { PureComponent } from 'react';

import { Dialog } from '../../../base/dialog';
import { translate, translateToHTML } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractTimerDialog from '../AbstractTimerDialog';
import { FieldTextStateless } from '@atlaskit/field-text';
import Button, { ButtonGroup } from '@atlaskit/button';




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
    }

    render() {
        const { t } = this.props;
        return (
            <Dialog
                okKey='dialog.timerStart'
                onSubmit={this._onSubmit}
                titleKey='dialog.timerTitle'
                width='medium'>
                <span>
                    {t('dialog.timerBodyMessage')}
                </span>

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
                />

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
                />
                <span>
                    {t('dialog.timerSimpleSetup')}
                </span>
                <br/>
                <ButtonGroup>
                    <Button
                        appearance='primary'>
                        5 { t('dialog.timerMin') }
                    </Button>
                    <Button
                        appearance='primary'>
                        3 { t('dialog.timerMin') }
                    </Button>
                    <Button
                        appearance='primary'>
                        1 { t('dialog.timerMin') }
                    </Button>
                    <Button
                        appearance='primary'>
                        30 { t('dialog.timerSec') }
                    </Button>
                    <Button
                        appearance='warning'>
                        { t('dialog.timerReset') }
                    </Button>
                </ButtonGroup>

            </Dialog>
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect()(TimerDialog));
