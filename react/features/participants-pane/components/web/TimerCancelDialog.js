/* @flow */

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
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
    }

    render() {
        const { t } = this.props;
        return (
            <Dialog
                okKey='dialog.timerStopOK'
                onSubmit={this._onStopped}
                titleKey='dialog.timerTitle'
                width='small'>
                <span>
                    {t('dialog.timerStop')}
                </span>
            </Dialog>
        );
    }

    _onStopped: () => boolean;
}

export default translate(connect()(TimerDialog));
