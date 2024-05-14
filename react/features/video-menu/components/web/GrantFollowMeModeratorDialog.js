// @flow

import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
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
        const { _isFollowMeModerator, t } = this.props;
        const title = _isFollowMeModerator
            ? 'dialog.cancelFollowMeModeratorTitle'
            : 'dialog.grantFollowMeModeratorTitle';
        const description = _isFollowMeModerator
            ? 'dialog.cancelFollowMeModeratorDialog'
            : 'dialog.grantFollowMeModeratorDialog';

        return (
            <Dialog
                okKey = 'dialog.Yes'
                onSubmit = { this._onSubmit }
                titleKey = { title }
                width = 'small'>
                <div>{ t(description) }</div>
            </Dialog>
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect()(GrantFollowMeModeratorDialog));
