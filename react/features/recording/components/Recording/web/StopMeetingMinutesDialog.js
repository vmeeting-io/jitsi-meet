import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n/functions';
import Dialog from '../../../../base/ui/components/web/Dialog';
import { toggleScreenshotCaptureSummary } from '../../../../screenshot-capture/actions';
import AbstractStopMeetingMinutesDialog, { _mapStateToProps } from '../AbstractStopMeetingMinutesDialog';

/**
 * React Component for getting confirmation to stop a meeting minutes session in
 * progress.
 *
 * @augments Component
 */
class StopMeetingMinutesDialog extends AbstractStopMeetingMinutesDialog {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t, localRecordingVideoStop } = this.props;

        return (
            <Dialog
                ok = {{ translationKey: 'dialog.confirm' }}
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.stopMeetingMinutes'>
                {t('dialog.stopMeetingMinutesWarning') }
            </Dialog>
        );
    }

    _onSubmit: () => boolean;

    /**
     * Toggles screenshot capture.
     *
     * @returns {void}
     */
    _toggleScreenshotCapture() {
        this.props.dispatch(toggleScreenshotCaptureSummary(false));
    }
}

export default translate(connect(_mapStateToProps)(StopMeetingMinutesDialog));
