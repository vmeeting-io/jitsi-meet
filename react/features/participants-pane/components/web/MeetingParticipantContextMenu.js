import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import {
    getLocalParticipant,
    getParticipantByIdOrUndefined
} from '../../../base/participants/functions';
import FakeParticipantContextMenu from '../../../video-menu/components/web/FakeParticipantContextMenu';
import ParticipantContextMenu from '../../../video-menu/components/web/ParticipantContextMenu';

/**
 * Implements the MeetingParticipantContextMenu component.
 */
class MeetingParticipantContextMenu extends Component {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _localVideoOwner,
            _participant,
            closeDrawer,
            drawerParticipant,
            offsetTarget,
            onEnter,
            onLeave,
            onSelect
        } = this.props;

        if (!_participant) {
            return null;
        }

        const props = {
            closeDrawer,
            drawerParticipant,
            offsetTarget,
            onEnter,
            onLeave,
            onSelect,
            participant: _participant,
            thumbnailMenu: false
        };

        if (_participant?.fakeParticipant) {
            return (
                <FakeParticipantContextMenu
                    { ...props }
                    localVideoOwner = { _localVideoOwner } />
            );
        }

        return <ParticipantContextMenu { ...props } />;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state, ownProps) {
    const { participantID, overflowDrawer, drawerParticipant } = ownProps;
    const { ownerId } = state['features/shared-video'];
    const localParticipantId = getLocalParticipant(state)?.id;

    const participant = getParticipantByIdOrUndefined(state,
        overflowDrawer ? drawerParticipant?.participantID : participantID);

    return {
        _localVideoOwner: Boolean(ownerId === localParticipantId),
        _participant: participant
    };
}

export default translate(connect(_mapStateToProps)(MeetingParticipantContextMenu));
