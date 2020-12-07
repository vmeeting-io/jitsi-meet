/* @flow */

import React, { Component } from 'react';

import TimeElapsed from './TimeElapsed';
import { BaseIndicator } from '../../base/react';
import { IconMicrophone, IconMicDisabled, IconCamera, IconCameraDisabled } from '../../base/icons'
/**
 * The type of the React {@code Component} props of {@link SpeakerStatsItem}.
 */
type Props = {

    /**
     * The name of the participant.
     */
    displayName: string,

    /**
     * The total milliseconds the participant has been dominant speaker.
     */
    dominantSpeakerTime: number,

    /**
     * True if the participant is no longer in the meeting.
     */
    hasLeft: boolean,

    /**
     * True if the participant is currently the dominant speaker.
     */
    isDominantSpeaker: boolean,

    /**
     * The participants' join/leave time.
     */
    participantLog: Object,

    /**
     * True if the participant's video is muted.
     */
    videoMuted: boolean,

    /**
     * True if the participant's audio is muted.
     */
    audioMuted: boolean,
};

/**
 * React component for display an individual user's speaker stats.
 *
 * @extends Component
 */
class SpeakerStatsItem extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const hasLeftClass = this.props.hasLeft ? 'status-user-left' : '';
        const rowDisplayClass = `speaker-stats-item ${hasLeftClass}`;

        const dotClass = this.props.isDominantSpeaker
            ? 'status-active' : 'status-inactive';
        const speakerStatusClass = `speaker-stats-item__status-dot ${dotClass}`;
        const videoMuted = this.props.videoMuted;
        const audioMuted = this.props.audioMuted;
        return (
            <div className = { rowDisplayClass }>
                <div className = 'speaker-stats-item__status'>
                    <span className = { speakerStatusClass } />
                </div>
                <div className = 'speaker-stats-item__name'> 
                    { this.props.displayName } &nbsp; { this.displayAudioStatus(audioMuted) } &nbsp; { this.displayVideoStatus(videoMuted) }
                </div>
                <div className = 'speaker-stats-item__time'>
                    <TimeElapsed
                        time = { this.props.dominantSpeakerTime } />
                </div>
                <div className = 'speaker-stats-item__s_time'>
                    { this.props.participantLog && this.props.participantLog["joinTime"]? this.hhmmss(this.props.participantLog["joinTime"]) : '' }
                </div>
                <div className = 'speaker-stats-item__l_time'>
                    { this.props.participantLog && this.props.participantLog["leaveTime"]? this.hhmmss(this.props.participantLog["leaveTime"]) : '' } 
                </div>
            </div>
        );
    }

    displayAudioStatus(audioMuted) {
        let iconClass;
        if(audioMuted) {
            iconClass = IconMicDisabled;
        }
        else {
            iconClass = IconMicrophone;
        }
        return(
            <BaseIndicator
                className = 'audioMuted toolbar-icon'
                icon = { iconClass }
                iconId = 'mic-disabled'
                iconSize = { 13 }
                tooltipKey = 'videothumbnail.mute'
                tooltipPosition = { 'top' } />
        );
    }

    displayVideoStatus(videoMuted) {
        let iconClass;
        if(videoMuted) {
            iconClass = IconCameraDisabled;
        }
        else {
            iconClass = IconCamera;
        }
        return(
            <BaseIndicator
                className = 'videoMuted toolbar-icon'
                icon = { iconClass }
                iconId = 'camera-disabled'
                iconSize = { 16 }
                tooltipKey = 'videothumbnail.videomute'
                tooltipPosition = { 'top' } />
        );
    }
    
    hhmmss(hms) {
        var hh = hms["hour"];
        var mm = hms["min"];
        var ss = hms["sec"];

        return [(hh>9 ? '' : '0') + hh, ':',
                (mm>9 ? '' : '0') + mm, ':',
                (ss>9 ? '' : '0') + ss,
                ].join('');
    }
}

export default SpeakerStatsItem;
