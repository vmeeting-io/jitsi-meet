import { Component } from 'react';

import { createRecordingDialogEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import ColorSchemeRegistry from '../../../base/color-scheme/ColorSchemeRegistry';
import { _abstractMapStateToProps } from '../../../base/dialog/functions';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import { authorizeDropbox, updateDropboxToken } from '../../../dropbox/actions';
import { isVpaasMeeting } from '../../../jaas/functions';
import { canAddTranscriber } from '../../../transcribing/functions';
import { RECORDING_TYPES } from '../../constants';
import { supportsLocalRecording } from '../../functions';

/**
 * React Component for getting confirmation to start a meeting minutes session.
 *
 * @augments Component
 */
class AbstractStartMeetingMinutesDialogContent extends Component {
    /**
     * Initializes a new {@code AbstractStartMeetingMinutesDialogContent} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        // Bind event handler; it bounds once for every instance.
        this._onSignIn = this._onSignIn.bind(this);
        this._onSignOut = this._onSignOut.bind(this);
        this._onDropboxSwitchChange = this._onDropboxSwitchChange.bind(this);
        this._onRecordingServiceSwitchChange = this._onRecordingServiceSwitchChange.bind(this);
        this._onLocalRecordingSwitchChange = this._onLocalRecordingSwitchChange.bind(this);
        this._onTranscriptionSwitchChange = this._onTranscriptionSwitchChange.bind(this);
        this._onRecordAudioAndVideoSwitchChange = this._onRecordAudioAndVideoSwitchChange.bind(this);
        this._onToggleShowOptions = this._onToggleShowOptions.bind(this);

        this.state = {
            showAdvancedOptions: true
        };
    }

    /**
     * Implements the Component's componentDidMount method.
     *
     * @inheritdoc
     */
    componentDidMount() {
        if (!this._shouldRenderNoIntegrationsContent()
            && !this._shouldRenderIntegrationsContent()
            && !this._shouldRenderFileSharingContent()) {
            this._onLocalRecordingSwitchChange();
        }
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps) {
        // Auto sign-out when the use chooses another recording service.
        if (prevProps.selectedRecordingService === RECORDING_TYPES.DROPBOX
                && this.props.selectedRecordingService !== RECORDING_TYPES.DROPBOX && this.props.isTokenValid) {
            this._onSignOut();
        }
    }

    /**
     * Returns whether the advanced options should be rendered.
     *
     * @returns {boolean}
     */
    _onToggleShowOptions() {
        this.setState({ showAdvancedOptions: !this.state.showAdvancedOptions });
    }

    /**
     * Whether the file sharing content should be rendered or not.
     *
     * @returns {boolean}
     */
    _shouldRenderFileSharingContent() {
        const {
            fileRecordingsServiceEnabled,
            fileRecordingsServiceSharingEnabled,
            isVpaas,
            selectedRecordingService
        } = this.props;

        if (!fileRecordingsServiceEnabled
            || !fileRecordingsServiceSharingEnabled
            || isVpaas
            || selectedRecordingService !== RECORDING_TYPES.JITSI_REC_SERVICE) {
            return false;
        }

        return true;
    }

    /**
     * Whether the save transcription content should be rendered or not.
     *
     * @returns {boolean}
     */
    _canStartTranscribing() {
        return this.props._canStartTranscribing;
    }

    /**
     * Whether the no integrations content should be rendered or not.
     *
     * @returns {boolean}
     */
    _shouldRenderNoIntegrationsContent() {
        // show the non integrations part only if fileRecordingsServiceEnabled
        // is enabled
        if (!this.props.fileRecordingsServiceEnabled) {
            return false;
        }

        return true;
    }

    /**
     * Whether the integrations content should be rendered or not.
     *
     * @returns {boolean}
     */
    _shouldRenderIntegrationsContent() {
        if (!this.props.integrationsEnabled) {
            return false;
        }

        return true;
    }

    /**
     * Handler for transcription switch change.
     *
     * @param {boolean} value - The new value.
     * @returns {void}
     */
    _onTranscriptionSwitchChange(value: boolean | undefined) {
        this.props.onTranscriptionChange(value);
    }

    /**
     * Handler for audio and video switch change.
     *
     * @param {boolean} value - The new value.
     * @returns {void}
     */
    _onRecordAudioAndVideoSwitchChange(value: boolean | undefined) {
        this.props.onRecordAudioAndVideoChange(value);
    }

    /**
     * Handler for onValueChange events from the Switch component.
     *
     * @returns {void}
     */
    _onRecordingServiceSwitchChange() {
        const {
            onChange,
            selectedRecordingService
        } = this.props;

        // act like group, cannot toggle off
        if (selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE) {
            return;
        }

        onChange(RECORDING_TYPES.JITSI_REC_SERVICE);
    }

    /**
     * Handler for onValueChange events from the Switch component.
     *
     * @returns {void}
     */
    _onDropboxSwitchChange() {
        const {
            isTokenValid,
            onChange,
            selectedRecordingService
        } = this.props;

        // act like group, cannot toggle off
        if (selectedRecordingService === RECORDING_TYPES.DROPBOX) {
            return;
        }

        onChange(RECORDING_TYPES.DROPBOX);

        if (!isTokenValid) {
            this._onSignIn();
        }
    }

    /**
     * Handler for onValueChange events from the Switch component.
     *
     * @returns {void}
     */
    _onLocalRecordingSwitchChange() {
        const {
            _localRecordingAvailable,
            onChange,
            selectedRecordingService
        } = this.props;

        if (!_localRecordingAvailable) {
            return;
        }

        // act like group, cannot toggle off
        if (selectedRecordingService
            === RECORDING_TYPES.LOCAL) {
            return;
        }

        onChange(RECORDING_TYPES.LOCAL);
    }

    /**
     * Sings in a user.
     *
     * @returns {void}
     */
    _onSignIn() {
        sendAnalytics(createRecordingDialogEvent('start', 'signIn.button'));
        this.props.dispatch(authorizeDropbox());
    }

    /**
     * Sings out an user from dropbox.
     *
     * @returns {void}
     */
    _onSignOut() {
        sendAnalytics(createRecordingDialogEvent('start', 'signOut.button'));
        this.props.dispatch(updateDropboxToken());
    }
}

/**
 * Maps part of the redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
export function mapStateToProps(state) {
    const { localRecording, recordingService } = state['features/base/config'];
    const _localRecordingAvailable
        = !localRecording?.disable && supportsLocalRecording();

    return {
        ..._abstractMapStateToProps(state),
        isVpaas: isVpaasMeeting(state),
        _canStartTranscribing: canAddTranscriber(state),
        _hideStorageWarning: Boolean(recordingService?.hideStorageWarning),
        _isModerator: isLocalParticipantModerator(state),
        _localRecordingAvailable,
        _localRecordingEnabled: !localRecording?.disable,
        _localRecordingSelfEnabled: !localRecording?.disableSelfRecording,
        _localRecordingNoNotification: !localRecording?.notifyAllParticipants,
        _styles: ColorSchemeRegistry.get(state, 'StartRecordingDialogContent')
    };
}

export default AbstractStartMeetingMinutesDialogContent;
