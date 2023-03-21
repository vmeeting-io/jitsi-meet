import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/styles';

import { getParticipantCount } from '../../../base/participants/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';

const useStyles = makeStyles(theme => {
    return {
        badge: {
            backgroundColor: theme.palette.ui03,
            borderRadius: '100%',
            height: '16px',
            minWidth: '16px',
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.labelBold),
            pointerEvents: 'none',
            position: 'absolute',
            right: '-4px',
            top: '-3px',
            textAlign: 'center',
            padding: '1px'
        }
    };
});

const ParticipantsCounter = () => {
    const styles = useStyles();
    const participantsCount = useSelector(getParticipantCount);

    return <span className = { styles.badge }>{participantsCount}</span>;
};

export default ParticipantsCounter;