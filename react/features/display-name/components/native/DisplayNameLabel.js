// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';

import { translate } from '../../../base/i18n';
import {
    getLocalParticipant,
    getParticipantById,
    getParticipantDisplayName,
    shouldRenderParticipantVideo
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { appendSuffix } from '../../functions';

import styles from './styles';

type Props = {

    /**
     * The name of the participant to render.
     */
    _participantName: string,

    /**
     * True of the label needs to be rendered. False otherwise.
     */
    _render: boolean,

    /**
     * The ID of the participant to render the label for.
     */
    participantId: string
}

/**
 * Renders a label with the display name of the on-stage participant.
 */
class DisplayNameLabel extends Component<Props> {
    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        if (!this.props._render) {
            return null;
        }

        const { _participantName, displayNameSuffix, t } = this.props;
        return (
            <View style = { styles.displayNameBackdrop }>
                <Text style = { styles.displayNameText }>
                { appendSuffix(_participantName, t(displayNameSuffix)) }
                </Text>
            </View>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {{
 * }}
 */
function _mapStateToProps(state: Object, ownProps: Props) {
    const { participantId } = ownProps;
    // const localParticipant = getLocalParticipant(state);
    const participant = getParticipantById(state, participantId);
    const isFakeParticipant = participant && participant.isFakeParticipant;

    // Currently we only render the display name if it's not the local
    // participant and there is no video rendered for
    // them.
    const _render = Boolean(participantId)
        // && localParticipant?.id !== participantId
        // && !shouldRenderParticipantVideo(state, participantId)
        && !isFakeParticipant;

    return {
        displayNameSuffix: participant?.local ? 'me' : '',
        _participantName:
            getParticipantDisplayName(state, participantId),
        _render
    };
}

export default translate(connect(_mapStateToProps)(DisplayNameLabel));
