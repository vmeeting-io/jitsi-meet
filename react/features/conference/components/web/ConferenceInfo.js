/* @flow */
/* global $ */

import React, { Component } from 'react';

import { getConferenceName, getConferenceTimeRemained } from '../../../base/conference/functions';
import { Icon, IconEdit } from '../../../base/icons';
import { isHost } from '../../../base/jwt';
import { getParticipantCount } from '../../../base/participants/functions';
import { connect } from '../../../base/redux';
import { translate } from '../../../base/i18n';
import { Tooltip } from '../../../base/tooltip';
import { E2EELabel } from '../../../e2ee';
import { LocalRecordingLabel } from '../../../local-recording';
import { RecordingLabel } from '../../../recording';
import { isToolboxVisible } from '../../../toolbox/functions.web';
import { TranscribingLabel } from '../../../transcribing';
import { VideoQualityLabel } from '../../../video-quality';
import ConferenceTimer from '../ConferenceTimer';

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
    _visible: boolean
};

/**
 * ConferenceInfo react component.
 *
 * @class ConferenceInfo
 */
class ConferenceInfo extends Component<Props> {

    constructor(props) {
        super(props);

        this._onEditSubject = this._onEditSubject.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _hideConferenceNameAndTimer,
            _hideConferenceTimer,
            _fullWidth,
            _isHost,
            _showParticipantCount,
            _subject,
            _visible,
            t
        } = this.props;

        return (
            <div className = { `subject ${_visible ? 'visible' : ''}` }>
                <div className = { `subject-info-container${_fullWidth ? ' subject-info-container--full-width' : ''}` }>
                    { !_hideConferenceNameAndTimer && (
                        <div className = 'subject-info'>
                            { _subject && (
                                _isHost ? (
                                    <Tooltip content = { t('dialog.edit') } position = 'bottom'>
                                        <span
                                            className = 'subject-text editable'
                                            onClick = { this._onEditSubject }>
                                            { _subject }
                                            <div className = 'button'>
                                                <Icon size = { 16 } src = { IconEdit } />
                                            </div>
                                        </span>
                                    </Tooltip>
                                ) : (
                                    <span className = 'subject-text'>
                                        { _subject }
                                    </span>
                                )
                            )}
                            { !_hideConferenceTimer && <ConferenceTimer /> }
                        </div>
                    )}
                    { _showParticipantCount && <ParticipantsCount /> }
                    <E2EELabel />
                    <RecordingLabel mode = { JitsiRecordingConstants.mode.FILE } />
                    <RecordingLabel mode = { JitsiRecordingConstants.mode.STREAM } />
                    <LocalRecordingLabel />
                    <TranscribingLabel />
                    <VideoQualityLabel />
                    <InsecureRoomNameLabel />
                </div>
            </div>
        );
    }

    _onEditSubject() {
        const { _subject, dispatch, t } = this.props;

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
    }
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
    const { hideConferenceTimer, hideConferenceSubject, hideParticipantsStats } = state['features/base/config'];
    const { clientWidth } = state['features/base/responsive-ui'];

    return {
        _hideConferenceNameAndTimer: clientWidth < 300,
        _hideConferenceTimer: Boolean(hideConferenceTimer),
        _fullWidth: state['features/video-layout'].tileViewEnabled,
        _isHost: isHost(state),
        _showParticipantCount: participantCount > 2 && !hideParticipantsStats,
        _showSubject: !hideConferenceSubject,
        _subject: hideConferenceSubject ? '' : getConferenceName(state),
        _visible: Boolean(timeRemained) || isToolboxVisible(state)
    };
}

export default translate(connect(_mapStateToProps)(ConferenceInfo));
