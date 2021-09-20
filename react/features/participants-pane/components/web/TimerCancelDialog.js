/* @flow */

import React, { PureComponent } from 'react';

import { Dialog } from '../../../base/dialog';
import { translate, translateToHTML } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractTimerDialog from '../AbstractTimerDialog';
import { FieldTextStateless } from '@atlaskit/field-text';
import Button, { ButtonGroup } from '@atlaskit/button';
import * as s from './TimerDialog.module.scss';

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
            <>
                <Dialog
                    okKey='dialog.timerStopOK'
                    onSubmit={this._onStopped}
                    titleKey='dialog.timerTitle'
                    width='small'>
                    <span>
                        {t('dialog.timerStop')}
                    </span>
                </Dialog>
            </>
        );
    }

    _onStopped: () => boolean;
}

export default translate(connect()(TimerDialog));
