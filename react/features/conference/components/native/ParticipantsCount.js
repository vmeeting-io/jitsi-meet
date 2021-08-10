// @flow

import React from 'react';

import { IconUserGroups } from '../../../base/icons';
import { Label } from '../../../base/label';
import { getParticipantCount } from '../../../base/participants';
import { connect } from '../../../base/redux';

import styles from './styles';


/**
 * The type of the React {@code Component} props of {@link ParticipantsCount}.
 */
type Props = {

    /**
     * Number of the conference participants.
     */
    count: string,
};

/**
 * ParticipantsCount react component.
 * Displays the number of participants and opens Speaker stats on click.
 *
 * @class ParticipantsCount
 */
function ParticipantsCount(props: Props) {
    return (
        <Label
            style = { styles.participantsCountView }
            textStyle = { styles.participantsCountText }
            icon = { IconUserGroups }
            text = { props.count } />
    );
}


/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code ParticipantsCount} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function mapStateToProps(state) {
    return {
        count: getParticipantCount(state)
    };
}

export default connect(mapStateToProps)(ParticipantsCount);
