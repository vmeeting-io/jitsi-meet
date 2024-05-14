import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IconRaiseHand } from '../../../base/icons/svg';
import { getParticipantById, hasRaisedHand } from '../../../base/participants/functions';
import BaseIndicator from '../../../base/react/components/web/BaseIndicator';

const useStyles = makeStyles()(theme => {
    return {
        raisedHandIndicator: {
            backgroundColor: theme.palette.warning02,
            padding: '4px',
            zIndex: 3,
            display: 'inline-block',
            borderRadius: '4px',
            boxSizing: 'border-box'
        }
    };
});

/**
 * Thumbnail badge showing that the participant would like to speak.
 *
 * @returns {ReactElement}
 */
const RaisedHandIndicator = ({
    iconSize,
    participantId,
    tooltipPosition
}) => {
    const participant = useSelector((state) =>
        getParticipantById(state, participantId));
    const _raisedHand = hasRaisedHand(participant);
    const { classes: styles, theme } = useStyles();

    if (!_raisedHand) {
        return null;
    }

    return (
        <div className = { styles.raisedHandIndicator }>
            <BaseIndicator
                icon = { IconRaiseHand }
                iconColor = { theme.palette.uiBackground }
                iconSize = { `${iconSize}px` }
                tooltipKey = 'raisedHand'
                tooltipPosition = { tooltipPosition } />
        </div>
    );
};

export default RaisedHandIndicator;
