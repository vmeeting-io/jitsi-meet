// @flow

import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
import AbstractDisableChatForAllParticipantsDialog
    from '../AbstractDisableChatForAllParticipantsDialog';

/**
 * Dialog to confirm a remote participant kick action.
 */
class DisableChatForAllParticipantsDialog extends AbstractDisableChatForAllParticipantsDialog {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                okKey = 'dialog.disableChatButton'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.disableChatForAllParticipantsTitle'
                width = 'small'>
                <div>
                    { this.props.t('dialog.disableChatForAllParticipantsDialog') }
                </div>
            </Dialog>
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect()(DisableChatForAllParticipantsDialog));
