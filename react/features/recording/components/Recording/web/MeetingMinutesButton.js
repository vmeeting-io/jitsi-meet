import { connect } from 'react-redux';

import { openDialog } from '../../../../base/dialog/actions';
import { translate } from '../../../../base/i18n/functions';
import AbstractMeetingMinutesButton, {
    _mapStateToProps as _abstractMapStateToProps
} from '../AbstractMeetingMinutesButton';

import StartMeetingMinutesDialog from './StartMeetingMinutesDialog';
import StopMeetingMinutesDialog from './StopMeetingMinutesDialog';


/**
 * Button for opening a dialog where a meeting minutes session can be started.
 */
class MeetingMinutesButton extends AbstractMeetingMinutesButton {

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _onHandleClick() {
        const { _isRecordingRunning, dispatch } = this.props;

        dispatch(openDialog(
            _isRecordingRunning ? StopMeetingMinutesDialog : StartMeetingMinutesDialog
        ));
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code MeetingMinutesButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _fileRecordingsDisabledTooltipKey: ?string,
 *     _isRecordingRunning: boolean,
 *     _disabled: boolean,
 *     visible: boolean
 * }}
 */
export function _mapStateToProps(state) {
    const abstractProps = _abstractMapStateToProps(state);
    const { toolbarButtons } = state['features/toolbox'];
    const visible = Boolean(toolbarButtons?.includes('meeting-minutes') && abstractProps.visible);

    return {
        ...abstractProps,
        visible
    };
}

export default translate(connect(_mapStateToProps)(MeetingMinutesButton));
