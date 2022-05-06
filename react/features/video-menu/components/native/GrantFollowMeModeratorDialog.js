// @flow

import React from 'react';

import { ConfirmDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractGrantFollowMeModeratorDialog
    from '../AbstractGrantFollowMeModeratorDialog';

/**
 * Dialog to confirm a remote participant kick action.
 */
class GrantFollowMeModeratorDialog extends AbstractGrantFollowMeModeratorDialog {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <ConfirmDialog
                contentKey = 'dialog.grantFollowMeModeratorDialog'
                onSubmit = { this._onSubmit } />
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect()(GrantFollowMeModeratorDialog));
