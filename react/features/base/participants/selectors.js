import { getParticipantDisplayName } from ".";

export const selectParticipantDisplayName = state => id =>
    getParticipantDisplayName(state, id);
