// eslint-disable-next-line lines-around-comment
import React from 'react';

import Avatar from '../../../base/avatar/components/Avatar';
import StatelessAvatar from '../../../base/avatar/components/web/StatelessAvatar';
import { getInitials } from '../../../base/avatar/functions';
import { IconUser } from '../../../base/icons/svg';
import BaseTheme from '../../../base/ui/components/BaseTheme.web';

import TimeElapsed from './TimeElapsed';
import Timeline from './Timeline';

const SpeakerStatsItem = (props) => {
    const rowDisplayClass = `row item ${props.hasLeft ? 'has-left' : ''}`;
    const nameTimeClass = `name-time${
        props.showFaceExpressions ? ' expressions-on' : ''
    }`;
    const timeClass = `time ${props.isDominantSpeaker ? 'dominant' : ''}`;

    return (
        <div key = { props.participantId }>
            <div className = { rowDisplayClass } >
                <div className = 'avatar' >
                    {
                        props.hasLeft ? (
                            <StatelessAvatar
                                className = 'userAvatar'
                                color = { BaseTheme.palette.ui04 }
                                iconUser = { IconUser }
                                initials = { getInitials(props.displayName) }
                                size = { 32 } />
                        ) : (
                            <Avatar
                                className = 'userAvatar'
                                participantId = { props.participantId }
                                size = { 32 } />
                        )
                    }
                </div>
                <div className = { nameTimeClass }>
                    <div
                        aria-label = { props.t('speakerStats.speakerStats') }
                        className = 'display-name'>
                        { props.displayName }
                    </div>
                    <div
                        aria-label = { props.t('speakerStats.speakerTime') }
                        className = { timeClass }>
                        <TimeElapsed
                            time = { props.dominantSpeakerTime } />
                    </div>
                </div>
                { props.showFaceExpressions
            && <Timeline faceLandmarks = { props.faceLandmarks } />
                }

            </div>
            <div className = 'separator' />
        </div>
    );
};

export default SpeakerStatsItem;
