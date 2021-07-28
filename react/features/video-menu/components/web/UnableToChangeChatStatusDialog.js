// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { getParticipantDisplayName } from '../../../base/participants';
import { connect } from '../../../base/redux';
import AbstractUnableToChangeChatStatusDialog
    from '../AbstractUnableToChangeChatStatusDialog';

/**
 * Dialog that displays a user is unable to change the chat status of a participant, 
 * if the selected participant is a moderator
 */
class UnableToChangeChatStatusDialog extends AbstractUnableToChangeChatStatusDialog {
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
                okKey = 'dialog.confirm'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.unableToChangeChatStatusTitle'
                width = 'small'>
                <div>
                    { t('dialog.unableToChangeChatStatusDialog', { to: _participantName }) }
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

export default translate(connect(_mapStateToProps)(UnableToChangeChatStatusDialog));
