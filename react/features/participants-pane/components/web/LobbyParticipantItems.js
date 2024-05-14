import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { LobbyParticipantItem } from './LobbyParticipantItem';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            margin: `${theme.spacing(3)} 0`
        }
    };
});

/**
 * Component used to display a list of knocking participants.
 *
 * @param {Object} props - The props of the component.
 * @returns {ReactNode}
 */
function LobbyParticipantItems({ openDrawerForParticipant, overflowDrawer, participants }) {
    const { classes } = useStyles();

    return (
        <div
            className = { classes.container }
            id = 'lobby-list'>
            {participants.map(p => (
                <LobbyParticipantItem
                    key = { p.id }
                    openDrawerForParticipant = { openDrawerForParticipant }
                    overflowDrawer = { overflowDrawer }
                    participant = { p } />)
            )}
        </div>
    );
}

// Memoize the component in order to avoid rerender on drawer open/close.
export default React.memo(LobbyParticipantItems);
