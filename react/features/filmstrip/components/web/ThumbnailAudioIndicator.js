import React, { useEffect, useState } from 'react';

import AudioLevelIndicator from '../../../audio-level-indicator/components/AudioLevelIndicator';
import JitsiMeetJS from '../../../base/lib-jitsi-meet/_';

const JitsiTrackEvents = JitsiMeetJS.events.track;

const ThumbnailAudioIndicator = ({
    _audioTrack
}) => {
    const [ audioLevel, setAudioLevel ] = useState(0);

    useEffect(() => {
        setAudioLevel(0);
        if (_audioTrack) {
            const { jitsiTrack } = _audioTrack;

            jitsiTrack?.on(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, setAudioLevel);
        }

        return () => {
            if (_audioTrack) {
                const { jitsiTrack } = _audioTrack;

                jitsiTrack?.off(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, setAudioLevel);
            }
        };
    }, [ _audioTrack ]);

    return (
        <span className = 'audioindicator-container'>
            <AudioLevelIndicator audioLevel = { audioLevel } />
        </span>
    );
};

export default ThumbnailAudioIndicator;
