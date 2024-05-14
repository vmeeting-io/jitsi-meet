// @flow

import { openDialog } from '../../base/dialog/actions';
import { IconCloseCircle } from '../../base/icons/svg';
import AbstractButton from '../../base/toolbox/components/AbstractButton';

import { KickRemoteParticipantDialog } from './';

/**
 * An abstract remote video menu button which kicks the remote participant.
 */
export default class AbstractKickButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.kick';
    icon = IconCloseCircle;
    label = 'videothumbnail.kick';

    /**
     * Handles clicking / pressing the button, and kicks the participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participantID } = this.props;

        dispatch(openDialog(KickRemoteParticipantDialog, { participantID }));
    }
}
