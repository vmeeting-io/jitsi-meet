import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { Video } from '../../base/media/components/index';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            position: 'relative',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: theme.spacing(4),
            backgroundColor: theme.palette.uiBackground
        },

        video: {
            height: 'auto',
            width: '100%',
            overflow: 'hidden'
        },

        errorText: {
            color: theme.palette.text01,
            left: 0,
            position: 'absolute',
            right: 0,
            textAlign: 'center',
            top: '50%'
        }
    };
});

const VideoInputPreview = ({ error, localFlipX, track }) => {
    const { classes, cx } = useStyles();

    return (
        <div className = { classes.container }>
            <Video
                className = { cx(classes.video, localFlipX && 'flipVideoX') }
                playsinline = { true }
                videoTrack = {{ jitsiTrack: track }} />
            {error && (
                <div className = { classes.errorText }>
                    {error}
                </div>
            )}
        </div>
    );
};

export default VideoInputPreview;
