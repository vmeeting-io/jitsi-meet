import { getParticipantDisplayName } from ".";

export const selectParticipantDisplayName = id => state =>
    getParticipantDisplayName(state, id);
