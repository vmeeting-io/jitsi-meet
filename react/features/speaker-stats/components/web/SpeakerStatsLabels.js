import React from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import TimelineAxis from './TimelineAxis';

const useStyles = makeStyles()(theme => {
    return {
        labels: {
            padding: '22px 0 7px 0',
            height: 20,
            '& .avatar-placeholder': {
                width: '32px',
                marginRight: theme.spacing(3)

            }
        }
    };
});

const SpeakerStatsLabels = (props) => {
    const { t } = useTranslation();
    const { classes } = useStyles();
    const nameTimeClass = `name-time${
        props.showFaceExpressions ? ' expressions-on' : ''
    }`;

    return (
        <div className = { `row ${classes.labels}` }>
            <div className = 'avatar-placeholder' />

            <div className = { nameTimeClass }>
                <div>
                    { t('speakerStats.name') }
                </div>
                <div>
                    { t('speakerStats.speakerTime') }
                </div>
            </div>
            {props.showFaceExpressions && <TimelineAxis />}
        </div>
    );
};

export default SpeakerStatsLabels;
