/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import E2EELabel from '../../../e2ee/components/E2EELabel';
import HighlightButton from '../../../recording/components/Recording/web/HighlightButton';
import RecordingLabel from '../../../recording/components/web/RecordingLabel';
import { showToolbox } from '../../../toolbox/actions.web';
import { isToolboxVisible } from '../../../toolbox/functions.web';
import VideoQualityLabel from '../../../video-quality/components/VideoQualityLabel.web';
import VisitorsCountLabel from '../../../visitors/components/web/VisitorsCountLabel';
import ConferenceTimer from '../ConferenceTimer';
import Timezone from '../Timezone';
import { getConferenceInfo } from '../functions.web';

import ConferenceInfoContainer from './ConferenceInfoContainer';
import InsecureRoomNameLabel from './InsecureRoomNameLabel';
import RaisedHandsCountLabel from './RaisedHandsCountLabel';
import SpeakerStatsLabel from './SpeakerStatsLabel';
import SubjectText from './SubjectText';
import ToggleTopPanelLabel from './ToggleTopPanelLabel';

const COMPONENTS = [
    {
        Component: HighlightButton,
        id: 'highlight-moment'
    },
    {
        Component: SubjectText,
        id: 'subject'
    },
    {
        Component: ConferenceTimer,
        id: 'conference-timer'
    },
    {
        Component: SpeakerStatsLabel,
        id: 'participants-count'
    },
    {
        Component: E2EELabel,
        id: 'e2ee'
    },
    {
        Component: () => (
            <>
                <RecordingLabel mode = { JitsiRecordingConstants.mode.FILE } />
                <RecordingLabel mode = { JitsiRecordingConstants.mode.STREAM } />
            </>
        ),
        id: 'recording'
    },
    {
        Component: RaisedHandsCountLabel,
        id: 'raised-hands-count'
    },
    {
        Component: VideoQualityLabel,
        id: 'video-quality'
    },
    {
        Component: VisitorsCountLabel,
        id: 'visitors-count'
    },
    {
        Component: InsecureRoomNameLabel,
        id: 'insecure-room'
    },
    {
        Component: ToggleTopPanelLabel,
        id: 'top-panel-toggle'
    }
];

/**
 * The upper band of the meeing containing the conference name, timer and labels.
 *
 * @param {Object} props - The props of the component.
 * @returns {React$None}
 */
class ConferenceInfo extends Component {
    /**
     * Initializes a new {@code ConferenceInfo} instance.
     *
     * @param {IProps} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._renderAutoHide = this._renderAutoHide.bind(this);
        this._renderAlwaysVisible = this._renderAlwaysVisible.bind(this);
        this._onTabIn = this._onTabIn.bind(this);
    }

    /**
     * Callback invoked when the component is focused to show the conference
     * info if necessary.
     *
     * @returns {void}
     */
    _onTabIn() {
        if (this.props._conferenceInfo.autoHide?.length && !this.props._visible) {
            this.props.dispatch(showToolbox());
        }
    }

    /**
     * Renders auto-hidden info header labels.
     *
     * @returns {void}
     */
    _renderAutoHide() {
        const { autoHide } = this.props._conferenceInfo;

        if (!autoHide?.length) {
            return null;
        }

        return (
            <ConferenceInfoContainer
                id = 'autoHide'
                visible = { this.props._visible }>
                {
                    COMPONENTS
                        .filter(comp => autoHide.includes(comp.id))
                        .map(c =>
                            <c.Component key = { c.id } />
                        )
                }
            </ConferenceInfoContainer>
        );
    }

    /**
     * Renders the always visible info header labels.
     *
     * @returns {void}
     */
    _renderAlwaysVisible() {
        const { alwaysVisible } = this.props._conferenceInfo;

        if (!alwaysVisible?.length) {
            return null;
        }

        return (
            <ConferenceInfoContainer
                id = 'alwaysVisible'
                visible = { true } >
                {
                    COMPONENTS
                        .filter(comp => alwaysVisible.includes(comp.id))
                        .map(c =>
                            <c.Component key = { c.id } />
                        )
                }
            </ConferenceInfoContainer>
        );
    }

    _renderTimezone() {
        if (!this.props._useTimezone) return null;

        return <Timezone useTimezone = { this.props._useTimezone } timezone = { this.props._timezone } />;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div
                className = 'details-container'
                onFocus = { this._onTabIn }>
                { this._renderAlwaysVisible() }
                { this._renderAutoHide() }
                { this._renderTimezone()}
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code Subject}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _visible: boolean,
 *     _conferenceInfo: Object
 * }}
 */
function _mapStateToProps(state) {
    return {
        _visible: isToolboxVisible(state),
        _conferenceInfo: getConferenceInfo(state),
        _useTimezone: state['features/base/config'].useTimezone,
        _timezone: state['features/base/jwt'].user?.timezone,
    };
}

export default connect(_mapStateToProps)(ConferenceInfo);
