// @flow

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IconRecord, IconStop } from '../../../base/icons/svg';
import { MEET_FEATURES } from '../../../base/jwt/constants';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { maybeShowPremiumFeatureDialog } from '../../../jaas/actions';
import { canStopRecording, getRecordButtonProps } from '../../functions';


/**
 * An abstract implementation of a button for starting and stopping recording.
 */
export default class AbstractRecordButton extends AbstractButton {
    accessibilityLabel = 'dialog.startRecording';
    toggledAccessibilityLabel = 'dialog.stopRecording';
    icon = IconRecord;
    label = 'dialog.startRecording';
    toggledLabel = 'dialog.stopRecording';
    toggledIcon = IconStop;

    /**
     * Returns the tooltip that should be displayed when the button is disabled.
     *
     * @private
     * @returns {string}
     */
    _getTooltip() {
        return this.props._tooltip || '';
    }

    /**
     * Helper function to be implemented by subclasses, which should be used
     * to handle the live stream button being clicked / pressed.
     *
     * @protected
     * @returns {void}
     */
    _onHandleClick() {
        // To be implemented by subclass.
    }

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    async _handleClick() {
        const { _isRecordingRunning, dispatch } = this.props;

        sendAnalytics(createToolbarEvent(
            'recording.button',
            {
                'is_recording': _isRecordingRunning,
                type: JitsiRecordingConstants.mode.FILE
            }));

        const dialogShown = await dispatch(maybeShowPremiumFeatureDialog(MEET_FEATURES.RECORDING));

        if (!dialogShown) {
            this._onHandleClick();
        }
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * boolean value indicating if this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._disabled;
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isRecordingRunning;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code RecordButton} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the Component.
 * @private
 * @returns {{
 *     _disabled: boolean,
 *     _isRecordingRunning: boolean,
 *     visible: boolean
 * }}
 */
export function _mapStateToProps(state: Object, ownProps: Props): Object {
    const {
        disabled: _disabled,
        tooltip: _tooltip,
        visible
    } = getRecordButtonProps(state);

    return {
        _disabled,
        _isRecordingRunning: canStopRecording(state),
        _tooltip,
        visible
    };
}
