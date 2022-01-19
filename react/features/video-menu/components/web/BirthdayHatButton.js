/* @flow */

import React from 'react';

import ContextMenuItem from '../../../base/components/context-menu/ContextMenuItem';
import { translate } from '../../../base/i18n';
import { IconBirthdayHat } from '../../../base/icons';
import { connect } from '../../../base/redux';
import AbstractBirthdayHatButton, {
    _mapStateToProps,
    type Props
} from '../AbstractBirthdayHatButton';

/**
 * Implements a React {@link Component} which displays a button for audio muting
 * a participant in the conference.
 *
 * NOTE: At the time of writing this is a button that doesn't use the
 * {@code AbstractButton} base component, but is inherited from the same
 * super class ({@code AbstractBirthdayHatButton} that extends {@code AbstractButton})
 * for the sake of code sharing between web and mobile. Once web uses the
 * {@code AbstractButton} base component, this can be fully removed.
 */
class BirthdayHatButton extends AbstractBirthdayHatButton {
    /**
     * Instantiates a new {@code Component}.
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
        const { _isHatOn, _participant, participantID, t } = this.props;
        const label = _isHatOn
            ? `participantsPane.actions.removeBirthdayARHat`
            : `participantsPane.actions.applyBirthdayARHat`;

        if (_isHatOn && !_participant.local) {
            return null;
        }

        return (
            <ContextMenuItem
                accessibilityLabel = { t(label) }
                className = 'kicklink'
                icon = { IconBirthdayHat }
                id = { `birthdayhat_${participantID}` }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick }
                text = { t(label) } />
        );
    }

    _handleClick: () => void
}

export default translate(connect(_mapStateToProps)(BirthdayHatButton));
