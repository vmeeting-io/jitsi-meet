import React from 'react';
import { useSelector } from 'react-redux';
import { useStyles } from 'tss-react/mui';

import VideoTrack from '../../../base/media/components/web/VideoTrack';
import { LAYOUTS } from '../../../video-layout/constants';
import { getCurrentLayout } from '../../../video-layout/functions.web';

import ThumbnailBottomIndicators from './ThumbnailBottomIndicators';
import ThumbnailTopIndicators from './ThumbnailTopIndicators';

const VirtualScreenshareParticipant = ({
    classes,
    containerClassName,
    isHovered,
    isLocal,
    isMobile,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onMouseMove,
    onTouchEnd,
    onTouchMove,
    onTouchStart,
    participantId,
    shouldDisplayTintBackground,
    styles,
    videoTrack,
    thumbnailType
}) => {
    const currentLayout = useSelector(getCurrentLayout);
    const videoTrackId = videoTrack?.jitsiTrack?.getId();
    const video = videoTrack && <VideoTrack
        id = { isLocal ? 'localScreenshare_container' : `remoteVideo_${videoTrackId || ''}` }
        muted = { true }
        style = { styles.video }
        videoTrack = { videoTrack } />;

    const { cx } = useStyles();

    return (
        <span
            className = { containerClassName }
            id = { `participant_${participantId}` }
            { ...(isMobile
                ? {
                    onTouchEnd,
                    onTouchMove,
                    onTouchStart
                }
                : {
                    onClick,
                    onMouseEnter,
                    onMouseMove,
                    onMouseLeave
                }
            ) }
            style = { styles.thumbnail }>
            {video}
            <div className = { classes?.containerBackground } />
            <div
                className = { cx(classes?.indicatorsContainer,
                        classes?.indicatorsTopContainer,
                        currentLayout === LAYOUTS.TILE_VIEW && 'tile-view-mode'
                ) }>
                <ThumbnailTopIndicators
                    isHovered = { isHovered }
                    participantId = { participantId }
                    thumbnailType = { thumbnailType } />
            </div>
            {shouldDisplayTintBackground && <div className = { classes?.tintBackground } />}
            <div
                className = { cx(classes?.indicatorsContainer,
                        classes?.indicatorsBottomContainer,
                        currentLayout === LAYOUTS.TILE_VIEW && 'tile-view-mode'
                ) }>
                <ThumbnailBottomIndicators
                    className = { classes?.indicatorsBackground }
                    local = { false }
                    participantId = { participantId }
                    showStatusIndicators = { true } />
            </div>
        </span>);
};

export default VirtualScreenshareParticipant;
