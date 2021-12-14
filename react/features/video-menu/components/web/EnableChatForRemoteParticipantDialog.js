// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { getParticipantDisplayName } from '../../../base/participants';
import { connect } from '../../../base/redux';
import AbstractEnableChatForRemoteParticipantDialog
    from '../AbstractEnableChatForRemoteParticipantDialog';

/**
 * Dialog to confirm a remote participant kick action.
 */
class EnableChatForRemoteParticipantDialog extends AbstractEnableChatForRemoteParticipantDialog {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _participantName, t } = this.props;

        return (
            <Dialog
                okKey = 'dialog.enableChatButton'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.enableChatForParticipantTitle'
                width = 'small'>
                <div>
                    { t('dialog.enableChatForParticipantDialog', { to: _participantName }) }
                </div>
            </Dialog>
        );
    }

    _onSubmit: () => boolean;
}

function _mapStateToProps(state, ownProps) {
    return {
        _participantName: getParticipantDisplayName(state, ownProps.participantID),
    };
}

export default translate(connect(_mapStateToProps)(EnableChatForRemoteParticipantDialog));
