// @flow

import {
    createRemoteVideoMenuButtonEvent,
    sendAnalytics
} from '../../analytics';
import { IconMicDisabled } from '../../base/icons';
import { MEDIA_TYPE } from '../../base/media';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { isRemoteTrackMuted } from '../../base/tracks';

import { MuteRemoteParticipantDialog } from '.';

export type Props = AbstractButtonProps & {

    /**
     * Boolean to indicate if the audio track of the participant is muted or
     * not.
     */
    _audioTrackMuted: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The ID of the participant object that this button is supposed to
     * mute/unmute.
     */
    participantID: string,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * An abstract remote video menu button which mutes the remote participant.
 */
export default class AbstractMuteButton extends AbstractButton<Props, *> {
    constructor(props) {
        super(props);

        this.accessibilityLabel = `toolbar.accessibilityLabel.remoteMute'}`;
        this.icon = IconMicDisabled;
        this.label = `videothumbnail.domute`;
        this.toggledLabel = `videothumbnail.muted`;
    }

    /**
     * Handles clicking / pressing the button, and mutes the participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participantID, t } = this.props;

        sendAnalytics(createRemoteVideoMenuButtonEvent(
            'mute.button',
            {
                'participant_id': participantID
            }));

            dispatch(openDialog(MuteRemoteParticipantDialog, { participantID }));
        }

    /**
     * Renders the item disabled if the participant is muted.
     *
     * @inheritdoc
     */
    _isDisabled() {
        const { _audioTrackMuted, _disableRemoteUnmute } = this.props;
        return _disableRemoteUnmute ? _audioTrackMuted : false;
    }

    /**
     * Renders the item toggled if the participant is muted.
     *
     * @inheritdoc
     */
    _isToggled() {
        const { _audioTrackMuted, _disableRemoteUnmute } = this.props;
        return _disableRemoteUnmute ? _audioTrackMuted : false;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @private
 * @returns {{
 *      _audioTrackMuted: boolean
 *  }}
 */
export function _mapStateToProps(state: Object, ownProps: Props) {
    const tracks = state['features/base/tracks'];
    const { disableRemoteUnmute } = state['features/base/config'];

    return {
        _audioTrackMuted: isRemoteTrackMuted(
            tracks, MEDIA_TYPE.AUDIO, ownProps.participantID),
        _disableRemoteUnmute: disableRemoteUnmute
    };
}
