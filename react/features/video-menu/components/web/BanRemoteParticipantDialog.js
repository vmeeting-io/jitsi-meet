// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { getParticipantDisplayName } from '../../../base/participants';
import { connect } from '../../../base/redux';
import AbstractBanRemoteParticipantDialog
    from '../AbstractBanRemoteParticipantDialog';

/**
 * Dialog to confirm a remote participant kick action.
 */
class BanRemoteParticipantDialog extends AbstractBanRemoteParticipantDialog {
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
                okKey = 'dialog.banButton'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.banParticipantTitle'
                width = 'small'>
                <div>
                    { t('dialog.banParticipantDialog', { to: _participantName }) }
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

export default translate(connect(_mapStateToProps)(BanRemoteParticipantDialog));
