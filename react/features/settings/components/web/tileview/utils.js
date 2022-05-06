/* global interfaceConfig */
import { appendSuffix } from '../../../../display-name';

export function getParticipantName(participant) {
    if (participant?.local) {
        return appendSuffix(participant.name, interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME);
    }

    return participant;
}
