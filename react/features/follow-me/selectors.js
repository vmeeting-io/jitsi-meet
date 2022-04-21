import { getFollowMeModerator } from ".";

export const isFollowMeModerator = participantId => state => {
    return getFollowMeModerator(state) === participantId;
}
