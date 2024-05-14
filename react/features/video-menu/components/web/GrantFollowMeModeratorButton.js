/* @flow */

import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconUserFollow } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
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
        const { _isFollowMeModerator, participantID, t, visible } = this.props;

        if (!visible) {
            return null;
        }

        const label = _isFollowMeModerator
            ? 'videothumbnail.cancelFollowMeModerator'
            : 'videothumbnail.grantFollowMeModerator';

        return (
            <ContextMenuItem
                accessibilityLabel = { t(label) }
                className = 'grantmoderatorlink'
                icon = { IconUserFollow }
                id = { `grantfollowmemoderatorlink_${participantID}` }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick }
                text = { t(label) } />
        );
    }

    _handleClick: () => void
}

export default translate(connect(_mapStateToProps)(GrantFollowMeModeratorButton));
