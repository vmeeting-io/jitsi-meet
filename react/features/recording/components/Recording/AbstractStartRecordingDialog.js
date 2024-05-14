import { Component } from 'react';

import { createRecordingDialogEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { updateDropboxToken } from '../../../dropbox/actions';
import { getDropboxData, getNewAccessToken, isEnabled as isDropboxEnabled } from '../../../dropbox/functions.any';
import { showErrorNotification } from '../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../../notifications/constants';
import { setRequestingSubtitles } from '../../../subtitles/actions.any';
import { setSelectedRecordingService, startLocalVideoRecording } from '../../actions';
import { RECORDING_METADATA_ID, RECORDING_TYPES } from '../../constants';
import { isRecordingSharingEnabled, shouldAutoTranscribeOnRecord, supportsLocalRecording } from '../../functions';

/**
 * Component for the recording start dialog.
 */
class AbstractStartRecordingDialog extends Component {
    /**
     * Initializes a new {@code StartRecordingDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onSubmit = this._onSubmit.bind(this);
        this._onSelectedRecordingServiceChanged
            = this._onSelectedRecordingServiceChanged.bind(this);
        this._onSharingSettingChanged = this._onSharingSettingChanged.bind(this);
        this._toggleScreenshotCapture = this._toggleScreenshotCapture.bind(this);
        this._onLocalRecordingSelfChange = this._onLocalRecordingSelfChange.bind(this);
        this._onTranscriptionChange = this._onTranscriptionChange.bind(this);
        this._onRecordAudioAndVideoChange = this._onRecordAudioAndVideoChange.bind(this);

        let selectedRecordingService = '';

        // TODO: Potentially check if we need to handle changes of
        // _fileRecordingsServiceEnabled and _areIntegrationsEnabled()
        if (this.props._fileRecordingsServiceEnabled
                || !this._areIntegrationsEnabled()) {
            selectedRecordingService = RECORDING_TYPES.JITSI_REC_SERVICE;
        } else if (this._areIntegrationsEnabled()) {
            if (props._localRecordingEnabled && supportsLocalRecording()) {
                selectedRecordingService = RECORDING_TYPES.LOCAL;
            } else {
                selectedRecordingService = RECORDING_TYPES.DROPBOX;
            }
        }

        this.state = {
            isTokenValid: false,
            isValidating: false,
            userName: undefined,
            sharingEnabled: true,
            shouldRecordAudioAndVideo: this.props._recordAudioAndVideo,
            shouldRecordTranscription: this.props._autoTranscribeOnRecord,
            spaceLeft: undefined,
            selectedRecordingService,
            localRecordingOnlySelf: false
        };
    }

    /**
     * Validates the oauth access token.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        if (typeof this.props._token !== 'undefined') {
            this._onTokenUpdated();
        }
    }

    /**
     * Validates the oauth access token.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(prevProps) {
        if (this.props._token !== prevProps._token) {
            this._onTokenUpdated();
        }
    }

    /**
     * Returns true if the integrations with third party services are enabled
     * and false otherwise.
     *
     * @returns {boolean} - True if the integrations with third party services
     * are enabled and false otherwise.
     */
    _areIntegrationsEnabled() {
        return this.props._isDropboxEnabled;
    }

    /**
     * Callback to handle sharing setting change from the dialog.
     *
     * @returns {void}
     */
    _onSharingSettingChanged() {
        this.setState({
            sharingEnabled: !this.state.sharingEnabled
        });
    }

    /**
     * Callback to handle local recording only self setting change.
     *
     * @returns {void}
     */
    _onLocalRecordingSelfChange() {
        this.setState({
            localRecordingOnlySelf: !this.state.localRecordingOnlySelf
        });
    }

    /**
     * Handles selected recording service changes.
     *
     * @param {string} selectedRecordingService - The new selected recording
     * service.
     * @returns {void}
     */
    _onSelectedRecordingServiceChanged(selectedRecordingService: string) {
        this.setState({ selectedRecordingService }, () => {
            this.props.dispatch(setSelectedRecordingService(selectedRecordingService));
        });
    }

    /**
     * Handles transcription switch change.
     *
     * @param {boolean} value - The new value.
     * @returns {void}
     */
    _onTranscriptionChange(value: boolean) {
        this.setState({
            shouldRecordTranscription: value
        });
    }

    /**
     * Handles audio and video switch change.
     *
     * @param {boolean} value - The new value.
     * @returns {void}
     */
    _onRecordAudioAndVideoChange(value: boolean) {
        this.setState({
            shouldRecordAudioAndVideo: value
        });
    }

    /**
     * Validates the dropbox access token and fetches account information.
     *
     * @returns {void}
     */
    _onTokenUpdated() {
        const { _appKey, _isDropboxEnabled, _token, _rToken, _tokenExpireDate, dispatch } = this.props;

        if (!_isDropboxEnabled) {
            return;
        }

        if (typeof _token === 'undefined') {
            this.setState({
                isTokenValid: false,
                isValidating: false
            });
        } else { // @ts-ignore
            if (_tokenExpireDate && Date.now() > new Date(_tokenExpireDate)) {
                getNewAccessToken(_appKey, _rToken)
                    .then((resp) =>
                        dispatch(updateDropboxToken(resp.token, resp.rToken, resp.expireDate)));

                return;
            }

            this.setState({
                isTokenValid: false,
                isValidating: true
            });
            getDropboxData(_token, _appKey).then(data => {
                if (typeof data === 'undefined') {
                    this.setState({
                        isTokenValid: false,
                        isValidating: false
                    });
                } else {
                    this.setState({
                        isTokenValid: true,
                        isValidating: false,
                        ...data
                    });
                }
            });
        }
    }

    /**
     * Starts a file recording session.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        const {
            _appKey,
            _conference,
            _displaySubtitles,
            _isDropboxEnabled,
            _rToken,
            _recorder_user,
            _subtitlesLanguage,
            _token,
            dispatch
        } = this.props;
        let appData;
        const attributes = {};

        if (this.state.shouldRecordAudioAndVideo) {
            switch (this.state.selectedRecordingService) {
            case RECORDING_TYPES.DROPBOX: {
                if (_isDropboxEnabled && _token) {
                    appData = JSON.stringify({
                        'file_recording_metadata': {
                            'upload_credentials': {
                                'service_name': RECORDING_TYPES.DROPBOX,
                                'token': _token,
                                'r_token': _rToken,
                                'app_key': _appKey
                            }
                        }
                    });
                    attributes.type = RECORDING_TYPES.DROPBOX;
                } else {
                    dispatch(showErrorNotification({
                        titleKey: 'dialog.noDropboxToken'
                    }, NOTIFICATION_TIMEOUT_TYPE.LONG));

                    return;
                }
                break;
            }
            case RECORDING_TYPES.JITSI_REC_SERVICE: {
                appData = JSON.stringify({
                    'file_recording_metadata': {
                        'share': this.state.sharingEnabled,
                        'meetingId': _conference.room.meetingId,
                        'recorder_identity': {
                            'email': _recorder_user.email,
                            'name': _recorder_user.name,
                        }
                    }
                });
                attributes.type = RECORDING_TYPES.JITSI_REC_SERVICE;
                break;
            }
            case RECORDING_TYPES.LOCAL: {
                dispatch(startLocalVideoRecording(this.state.localRecordingOnlySelf));

                return true;
            }
            }

            sendAnalytics(
                createRecordingDialogEvent('start', 'confirm.button', attributes)
            );

            this._toggleScreenshotCapture();
            _conference?.startRecording({
                mode: JitsiRecordingConstants.mode.FILE,
                appData
            });
        }

        if (this.state.selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE
                && this.state.shouldRecordTranscription) {
            dispatch(setRequestingSubtitles(true, _displaySubtitles, _subtitlesLanguage));
        }

        _conference?.getMetadataHandler().setMetadata(RECORDING_METADATA_ID, {
            isTranscribingEnabled: this.state.shouldRecordTranscription
        });

        return true;
    }

    /**
     * Toggles screenshot capture feature.
     *
     * @returns {void}
     */
    _toggleScreenshotCapture() {
        // To be implemented by subclass.
    }

    /**
     * Renders the platform specific dialog content.
     *
     * @protected
     * @returns {React$Component}
     */
    _renderDialogContent: () => React.Component;
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code StartRecordingDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @param {any} _ownProps - Component's own props.
 * @private
 * @returns {IProps}
 */
export function mapStateToProps(state, _ownProps) {
    const {
        recordingService,
        dropbox = { appKey: undefined },
        localRecording,
        recordings = { recordAudioAndVideo: true }
    } = state['features/base/config'];
    const recorder_user = state['features/base/jwt'].user;
    const {
        _displaySubtitles,
        _language: _subtitlesLanguage
    } = state['features/subtitles'];

    return {
        _appKey: dropbox.appKey ?? '',
        _autoTranscribeOnRecord: shouldAutoTranscribeOnRecord(state),
        _conference: state['features/base/conference'].conference,
        _displaySubtitles,
        _fileRecordingsServiceEnabled: recordingService?.enabled ?? false,
        _fileRecordingsServiceSharingEnabled: isRecordingSharingEnabled(state),
        _isDropboxEnabled: isDropboxEnabled(state),
        _localRecordingEnabled: !localRecording?.disable,
        _rToken: state['features/dropbox'].rToken ?? '',
        _recordAudioAndVideo: recordings?.recordAudioAndVideo ?? true,
        _recorder_user: recorder_user,
        _subtitlesLanguage,
        _tokenExpireDate: state['features/dropbox'].expireDate,
        _token: state['features/dropbox'].token ?? ''
    };
}

export default AbstractStartRecordingDialog;
