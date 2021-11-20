// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractGrantModeratorDialog from '../AbstractGrantFollowMeModeratorDialog';

/**
 * Dialog to confirm a grant follow me moderator action.
 */
class GrantFollowMeModeratorDialog extends AbstractGrantModeratorDialog {
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
                titleKey = 'dialog.grantFollowMeModeratorTitle'
                width = 'small'>
                <div>
                    { this.props.t('dialog.grantFollowMeModeratorDialog') }
                </div>
            </Dialog>
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect()(GrantFollowMeModeratorDialog));
