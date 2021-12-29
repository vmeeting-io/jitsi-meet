/* @flow */

import React from 'react';

import ContextMenuItem from '../../../base/components/context-menu/ContextMenuItem';
import { translate } from '../../../base/i18n';
import { IconUserFollow } from '../../../base/icons';
import { connect } from '../../../base/redux';
import AbstractGrantFollowMeModeratorButton, {
    _mapStateToProps,
    type Props
} from '../AbstractGrantFollowMeModeratorButton';

/**
 * Implements a React {@link Component} which displays a button for granting
 * moderator to a participant.
 */
class GrantFollowMeModeratorButton extends AbstractGrantFollowMeModeratorButton {
    /**
     * Instantiates a new {@code GrantModeratorButton}.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._handleClick = this._handleClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { participantID, t, visible } = this.props;

        if (!visible) {
            return null;
        }

        return (
            <ContextMenuItem
                accessibilityLabel = { t('videothumbnail.grantFollowMeModerator') }
                className = 'grantmoderatorlink'
                icon = { IconUserFollow }
                id = { `grantfollowmemoderatorlink_${participantID}` }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick }
                text = { t('videothumbnail.grantFollowMeModerator') } />
        );
    }

    _handleClick: () => void
}

export default translate(connect(_mapStateToProps)(GrantFollowMeModeratorButton));
