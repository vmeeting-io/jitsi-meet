export const isFollowMeModerator = participantId =>
    state => state['features/follow-me'].moderator === participantId;
