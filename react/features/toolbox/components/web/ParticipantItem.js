import React from 'react';
import { useTranslation } from 'react-i18next';

import { Avatar } from '../../../base/avatar';
import { Icon, IconCheck } from '../../../base/icons';
import { getParticipantById, getParticipantDisplayName } from '../../../base/participants';
import { connect } from '../../../base/redux';

function ParticipantItem(props) {
    const {
        _isFakeParticipant,
        name,
        onClick,
        participantID,
        selected
    } = props;
    const className = selected ? 'menu-item-selected' : 'menu-item';
    const { t } = useTranslation();

    if (_isFakeParticipant) {
        return null;
    }

    return (
        <li
            aria-label = { t('toolbar.accessibilityLabel.moderatorSelectionList') }
            className = { className }
            onClick = { onClick }
            key = { participantID } >
            <div className = 'avatar'>
                <Avatar participantId = { participantID } size = { 24 } />
            </div>
            <div className = 'text'>{ name }</div>
            <div className = 'icon'>
            { selected && <Icon src = { IconCheck } /> }
            </div>
        </li>
    );
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function mapStateToProps(state, ownProps): Object {
    const name = getParticipantDisplayName(state, ownProps.participantID);
    const participant = getParticipantById(state, ownProps.participantID);

    return {
        _isFakeParticipant: participant?.isFakeParticipant,
        name,
    };
}

export default connect(mapStateToProps)(ParticipantItem);
