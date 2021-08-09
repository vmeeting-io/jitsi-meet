/* @flow */
/* global $ */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { getConferenceName, getConferenceTimeRemained } from '../../../base/conference/functions';
import { Icon, IconEdit } from '../../../base/icons';
import { isHost } from '../../../base/jwt';
import { getParticipantCount } from '../../../base/participants/functions';
import { connect } from '../../../base/redux';
import { translate } from '../../../base/i18n';
import { Tooltip } from '../../../base/tooltip';
import { E2EELabel } from '../../../e2ee';
import { LocalRecordingLabel } from '../../../local-recording';
import { getSessionStatusToShow, RecordingLabel } from '../../../recording';
import { isToolboxVisible } from '../../../toolbox/functions.web';
import { TranscribingLabel } from '../../../transcribing';
import { VideoQualityLabel } from '../../../video-quality';
import ConferenceTimer from '../ConferenceTimer';
import { PARTICIPANT_ROLE } from '../../../base/participants';

import ParticipantsCount from './ParticipantsCount';

import { InsecureRoomNameLabel } from '.';

import { setSubject } from '../../../base/conference';
import { showConfirmDialog } from '../../../notifications/functions.web';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';

/**
 * The type of the React {@code Component} props of {@link ConferenceInfo}.
 */
type Props = {

    /**
     * Whether the info should span across the full width.
     */
    _fullWidth: boolean,

    /**
     * Whether the conference name and timer should be displayed or not.
     */
    _hideConferenceNameAndTimer: boolean,

    /**
     * Whether the conference timer should be shown or not.
     */
    _hideConferenceTimer: boolean,

    /**
     * Whether the recording label should be shown or not.
     */
    _hideRecordingLabel: boolean,

    /**
     * Whether the participant count should be shown or not.
     */
    _showParticipantCount: boolean,

    /**
     * The subject or the of the conference.
     * Falls back to conference name.
     */
    _subject: string,

    /**
     * Indicates whether the component should be visible or not.
     */
    _visible: boolean,

    /**
     * Whether or not the recording label is visible.
     */
    _recordingLabel: boolean
};

const getLeftMargin = () => {
    const subjectContainerWidth = document.getElementById('subject-container')?.clientWidth ?? 0;
    const recContainerWidth = document.getElementById('rec-container')?.clientWidth ?? 0;
    const subjectDetailsContainer = document.getElementById('subject-details-container')?.clientWidth ?? 0;

    return (subjectContainerWidth - recContainerWidth - subjectDetailsContainer) / 2;
};

/**
 * ConferenceInfo react component.
 *
 * @class ConferenceInfo
 */
function ConferenceInfo(props: Props) {
    const {
        _hideConferenceNameAndTimer,
        _hideConferenceTimer,
        _showParticipantCount,
        _hideRecordingLabel,
        // _isHost,
        _subject,
        _fullWidth,
        _visible,
        _recordingLabel,
        _isModerator
    } = props;
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const _onEditSubject = useCallback(() => {
        showConfirmDialog({
            text: t('dialog.changeSubject'),
            input: 'text',
            inputValue: _subject,
            showCancelButton: true,
            confirmButtonText: t('dialog.Change'),
            cancelButtonText: t('dialog.Cancel'),
            didOpen: () => {
                $('.swal2-input').select();
            }
        }).then(result => {
            if (result.isConfirmed) {
                dispatch(setSubject(result.value));
            }
        });
    }, [_subject, dispatch, t]);

    // change _isModerator to _isHost to only allow person who made the room to edit room subject
    return (
        <div className = { `subject ${_recordingLabel ? 'recording' : ''} ${_visible ? 'visible' : ''}` }>
            <div
                className = { `subject-info-container${_fullWidth ? ' subject-info-container--full-width' : ''}` }
                id = 'subject-container'>
                {!_hideRecordingLabel && <div
                    className = 'show-always'
                    id = 'rec-container'
                    // eslint-disable-next-line react-native/no-inline-styles
                    style = {{
                        marginLeft: !_recordingLabel || _visible ? 0 : getLeftMargin()
                    }}>
                    <RecordingLabel mode = { JitsiRecordingConstants.mode.FILE } />
                    <RecordingLabel mode = { JitsiRecordingConstants.mode.STREAM } />
                    <LocalRecordingLabel />
                </div>
                }
                <div
                    className = 'subject-details-container'
                    id = 'subject-details-container'>
                    {
                        !_hideConferenceNameAndTimer
                            && <div className = 'subject-info'>
                                { _subject && (
                                    _isModerator ? (
                                        <Tooltip content = { t('dialog.edit') } position = 'bottom'>
                                            <span className = 'subject-text editable' onClick = { _onEditSubject }>
                                                { _subject }
                                                <div className = 'button'>
                                                    <Icon size = { 16 } src = { IconEdit } />
                                                </div>
                                            </span>
                                        </Tooltip>
                                    ) : (
                                        <span className = 'subject-text'>{ _subject }</span>
                                    )
                                )}
                                { !_hideConferenceTimer && <ConferenceTimer /> }
                            </div>
                    }
                    { _showParticipantCount && <ParticipantsCount /> }
                    <E2EELabel />
                    {_hideRecordingLabel && (
                        <>
                            <RecordingLabel mode = { JitsiRecordingConstants.mode.FILE } />
                            <RecordingLabel mode = { JitsiRecordingConstants.mode.STREAM } />
                            <LocalRecordingLabel />
                        </>
                    )}
                    <TranscribingLabel />
                    <VideoQualityLabel />
                    <InsecureRoomNameLabel />
                </div>
            </div>
        </div>
    );
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code ConferenceInfo}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _hideConferenceTimer: boolean,
 *     _showParticipantCount: boolean,
 *     _subject: string,
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state) {
    const participantCount = getParticipantCount(state);
    const timeRemained = getConferenceTimeRemained(state);
    const {
        hideConferenceTimer,
        hideConferenceSubject,
        hideParticipantsStats,
        hideRecordingLabel,
        iAmRecorder
    } = state['features/base/config'];
    const { clientWidth } = state['features/base/responsive-ui'];

    const shouldHideRecordingLabel = hideRecordingLabel || iAmRecorder;
    const fileRecordingStatus = getSessionStatusToShow(state, JitsiRecordingConstants.mode.FILE);
    const streamRecordingStatus = getSessionStatusToShow(state, JitsiRecordingConstants.mode.STREAM);
    const isFileRecording = fileRecordingStatus ? fileRecordingStatus !== JitsiRecordingConstants.status.OFF : false;
    const isStreamRecording = streamRecordingStatus
        ? streamRecordingStatus !== JitsiRecordingConstants.status.OFF : false;
    const { isEngaged } = state['features/local-recording'];
    const isModerator = state['features/base/participants']?.local?.role === PARTICIPANT_ROLE.MODERATOR;

    return {
        _hideConferenceNameAndTimer: clientWidth < 300,
        _hideConferenceTimer: Boolean(hideConferenceTimer),
        _hideRecordingLabel: shouldHideRecordingLabel,
        _fullWidth: state['features/video-layout'].tileViewEnabled,
        // _isHost: isHost(state),
        _showParticipantCount: participantCount > 2 && !hideParticipantsStats,
        _showSubject: !hideConferenceSubject,
        _subject: hideConferenceSubject ? '' : getConferenceName(state),
        _visible: Boolean(timeRemained) || isToolboxVisible(state),
        _recordingLabel: (isFileRecording || isStreamRecording || isEngaged) && !shouldHideRecordingLabel,
        _isModerator: isModerator
    };
}

export default translate(connect(_mapStateToProps)(ConferenceInfo));
