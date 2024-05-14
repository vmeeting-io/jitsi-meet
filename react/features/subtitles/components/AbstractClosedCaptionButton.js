// @flow

import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { MEET_FEATURES } from '../../base/jwt/constants';
import { isLocalParticipantModerator } from '../../base/participants/functions';
import AbstractButton from '../../base/toolbox/components/AbstractButton';
import { maybeShowPremiumFeatureDialog } from '../../jaas/actions';
import { toggleRequestingSubtitles } from '../actions.any';

/**
 * The button component which starts/stops the transcription.
 */
export class AbstractClosedCaptionButton extends AbstractButton {
    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    async _handleClick() {
        const { _requestingSubtitles, dispatch, handleClick } = this.props;

        if (handleClick) {
            handleClick();

            return;
        }

        sendAnalytics(createToolbarEvent('transcribing.ccButton',
            {
                'requesting_subtitles': Boolean(_requestingSubtitles)
            }));


        const dialogShown = await dispatch(maybeShowPremiumFeatureDialog(MEET_FEATURES.RECORDING));

        if (!dialogShown) {
            dispatch(toggleRequestingSubtitles());
        }
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return false;
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._requestingSubtitles;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code AbstractClosedCaptionButton} component.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component
 * instance.
 * @private
 * @returns {{
 *     _requestingSubtitles: boolean,
 *     visible: boolean
 * }}
 */
export function _abstractMapStateToProps(state: Object, ownProps: Object) {
    const { _requestingSubtitles } = state['features/subtitles'];
    const { transcribingEnabled } = state['features/base/config'];
    const { isTranscribing } = state['features/transcribing'];

    // if the participant is moderator, it can enable transcriptions and if
    // transcriptions are already started for the meeting, guests can just show them
    const { visible = Boolean(transcribingEnabled
        && (isLocalParticipantModerator(state) || isTranscribing)) } = ownProps;

    return {
        _requestingSubtitles,
        visible
    };
}
