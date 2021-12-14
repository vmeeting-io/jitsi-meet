// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractEnableChatForAllParticipantsDialog
    from '../AbstractEnableChatForAllParticipantsDialog';

/**
 * Dialog to confirm a remote participant kick action.
 */
class EnableChatForAllParticipantsDialog extends AbstractEnableChatForAllParticipantsDialog {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <Dialog
                okKey = 'dialog.enableChatButton'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.enableChatForAllParticipantsTitle'
                width = 'small'>
                <div>
                    { t('dialog.enableChatForAllParticipantsDialog') }
                </div>
            </Dialog>
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect()(EnableChatForAllParticipantsDialog));
