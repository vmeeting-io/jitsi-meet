// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { getParticipantDisplayName } from '../../../base/participants';
import { connect } from '../../../base/redux';
import AbstractDisableChatForRemoteParticipantDialog
    from '../AbstractDisableChatForRemoteParticipantDialog';

/**
 * Dialog to confirm a remote participant kick action.
 */
class DisableChatForRemoteParticipantDialog extends AbstractDisableChatForRemoteParticipantDialog {
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
                okKey = 'dialog.disableChatButton'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.disableChatForParticipantTitle'
                width = 'small'>
                <div>
                    { t('dialog.disableChatForParticipantDialog', { to: _participantName }) }
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

export default translate(connect(_mapStateToProps)(DisableChatForRemoteParticipantDialog));
