/* @flow */

import moment from 'moment';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import { BaseIndicator } from '../../base/react';
import {
    IconCamera,
    IconCameraDisabled,
    IconChatDisabled,
    IconChatEnabled,
    IconModerator,
    IconMicDisabled,
    IconMicrophone,
    IconShareDesktop
} from '../../base/icons'

import s from './SpeakerStatsItem.module.scss';
import { formatDuration, formatTime } from '../../base/util/formatDateTime';

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of {@link SpeakerStatsItem}.
 */
type Props = {

    /**
     * The name of the participant.
     */
    displayName: string,

    /**
     * True if the participant is no longer in the meeting.
     */
    hasLeft: boolean,

    /**
     * The join time.
     */
    joinTime: string,

    /**
     * The leave time.
     */
    leaveTime: string,

    /**
     * The duration time.
     */
    duration: string,

    /**
     * True if video is muted.
     */
    videoMuted: boolean,

    /**
     * True if audio is muted.
     */
    audioMuted: boolean,

    /**
     * True if speaker is moderator.
     */
    isModerator: boolean,

    /**
     * True if speaker is presenter.
     */
    isPresenter: boolean
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
        const {
            joinTime,
            leaveTime,
            duration,
            isModerator,
            isPresenter,
            videoMuted,
            audioMuted,
            local,
            name,
            hasLeft,
            chat,
            t
        } = this.props;

        const hasLeftClass = hasLeft ? 'status-user-left' : '';
        const rowDisplayClass = `speaker-stats-item ${hasLeftClass}`;

        let displayName;
        if (local) {
            const me = t('me');
            displayName = name ? `${name} (${me})` : me;
        } else {
            displayName = name || interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME;
        }

        return (
            <div className = { `${rowDisplayClass} ${s.itemContainer}` }>
                <div className = { `speaker-stats-item__name ${s.nameContainer}` }> 
                    <span className = { s.name }>{ displayName }</span>
                </div>
                <div className = { s.statusContainer }>
                    { this.displayModeratorStatus(isModerator) }
                    { this.displayPresenterStatus(isPresenter) }
                    { this.displayAudioStatus(audioMuted) }
                    { this.displayVideoStatus(videoMuted) }
                    { this.displayChatStatus(chat) }
                </div>
                <div className = { `speaker-stats-item__s_time ${s.joinTime}` }>
                    { formatTime(joinTime) }
                </div>
                <div className = { `speaker-stats-item__l_time ${s.leaveTime}` }>
                    { formatTime(leaveTime) } 
                </div>
                <div className = { s.duration }>
                    { formatDuration(duration) }
                </div>
            </div>
        );
    }

    displayAudioStatus(audioMuted) {
        let icon;
        let iconClass = this.props.hasLeft || audioMuted ? s.disabled : '';
        let toolTipMessage;

        if (audioMuted) {
            icon = IconMicDisabled;
            toolTipMessage = 'videothumbnail.muted';
        } else {
            icon = IconMicrophone;
            toolTipMessage = 'videothumbnail.audioconnected';
        }

        return(
            <BaseIndicator
                className = { `audioMuted toolbar-icon ${iconClass}` }
                icon = { icon }
                iconId = 'mic-disabled'
                iconSize = { 16 }
                tooltipKey = { toolTipMessage }
                tooltipPosition = { 'top' } />
        );
    }

    displayVideoStatus(videoMuted) {
        let icon;
        let iconClass = this.props.hasLeft || videoMuted ? s.disabled : '';
        let toolTipMessage;

        if (videoMuted) {
            icon = IconCameraDisabled;
            toolTipMessage = 'videothumbnail.videomuted'
        }
        else {
            icon = IconCamera;
            toolTipMessage = 'videothumbnail.videoconnected'
        }
        return(
            <BaseIndicator
                className = { `videoMuted toolbar-icon ${iconClass}` }
                icon = { icon }
                iconId = 'camera-disabled'
                iconSize = { 16 }
                tooltipKey = { toolTipMessage }
                tooltipPosition = { 'top' } />
        );
    }

    displayModeratorStatus(isModerator) {
        let toolTipMessage = isModerator ? 'videothumbnail.moderator' : '';

        return (
            <BaseIndicator
                className = { isModerator ? '' : s.disabled }
                icon = { IconModerator }
                iconId = 'crown'
                iconSize = { 16 }
                tooltipKey = { toolTipMessage }
                tooltipPosition = 'top' />
        );
    }

    displayPresenterStatus(isPresenter) {
        let iconClass = this.props.hasLeft || !isPresenter ? s.disabled : '';
        let toolTipMessage = isPresenter ? 'videothumbnail.presenter' : '';

        return(
            <BaseIndicator
                className = { `videoMuted toolbar-icon ${iconClass}` }
                icon = { IconShareDesktop }
                iconId = 'share-desktop'
                iconSize = { 16 }
                tooltipKey = { toolTipMessage }
                tooltipPosition = { 'top' } />
        );
    }

    displayChatStatus(chatEnabled) {
        let toolTipMessage = chatEnabled ? 'dialog.chatEnabledTitle' : 'dialog.chatDisabledTitle';

        return (
            <BaseIndicator
                className = { chatEnabled ? '' : s.disabled }
                icon = { chatEnabled ? IconChatEnabled : IconChatDisabled }
                iconId = 'chat'
                iconSize = { chatEnabled ? 14 : 16}
                tooltipKey = { toolTipMessage }
                tooltipPosition = 'top' />
        );
    }
}

export default translate(SpeakerStatsItem);
