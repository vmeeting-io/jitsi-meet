/* @flow */

import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
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
