/* @flow */

import React, { Component } from 'react';

import { translate } from '../../base/i18n';

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
            local,
            name,
            hasLeft,
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
            <div className = { rowDisplayClass }>
                <div className = 'speaker-stats-item__name'> 
                    <span className = 'name'>{ displayName }</span>
                </div>
                <div className = 'speaker-stats-item__s_time'>
                    { formatTime(joinTime) }
                </div>
                <div className = 'speaker-stats-item__l_time'>
                    { formatTime(leaveTime) } 
                </div>
                <div className = 'speaker-stats-item__duration'>
                    { formatDuration(duration) }
                </div>
            </div>
        );
    }
}

export default translate(SpeakerStatsItem);
