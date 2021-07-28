// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractRevokeModeratorDialog
    from '../AbstractRevokeModeratorDialog';

/**
 * Dialog to confirm a grant moderator action.
 */
class RevokeModeratorDialog extends AbstractRevokeModeratorDialog {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                okKey = 'dialog.Yes'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.revokeModeratorTitle'
                width = 'small'>
                <div>
                    { this.props.t('dialog.revokeModeratorDialog') }
                </div>
            </Dialog>
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect()(RevokeModeratorDialog));
