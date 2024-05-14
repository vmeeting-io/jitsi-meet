import React from 'react';

import MeetingParticipantItem from './MeetingParticipantItem';

/**
 * Component used to display a list of meeting participants.
 *
 * @returns {ReactNode}
 */
function MeetingParticipantItems({
    isInBreakoutRoom,
    lowerMenu,
    toggleMenu,
    muteAudio,
    participantIds,
    openDrawerForParticipant,
    overflowDrawer,
    raiseContextId,
    participantActionEllipsisLabel,
    searchString,
    stopVideo,
    youText
}) {
    const renderParticipant = (id: string) => (
        <MeetingParticipantItem
            isHighlighted = { raiseContextId === id }
            isInBreakoutRoom = { isInBreakoutRoom }
            key = { id }
            muteAudio = { muteAudio }
            onContextMenu = { toggleMenu(id) }
            onLeave = { lowerMenu }
            openDrawerForParticipant = { openDrawerForParticipant }
            overflowDrawer = { overflowDrawer }
            participantActionEllipsisLabel = { participantActionEllipsisLabel }
            participantID = { id }
            searchString = { searchString }
            stopVideo = { stopVideo }
            youText = { youText } />
    );

    return (<>
        {participantIds.map(renderParticipant)}
    </>);
}

// Memoize the component in order to avoid rerender on drawer open/close.
export default React.memo(MeetingParticipantItems);
