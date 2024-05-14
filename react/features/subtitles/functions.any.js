import { canAddTranscriber, isTranscribing } from '../transcribing/functions';

/**
 * Checks whether the participant can start the subtitles.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - True if the participant can start the subtitles.
 */
export function canStartSubtitles(state) {
    return canAddTranscriber(state) || isTranscribing(state);
}
