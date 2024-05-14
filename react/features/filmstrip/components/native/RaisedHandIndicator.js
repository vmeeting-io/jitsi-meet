import React, { Component } from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import { IconRaiseHand } from '../../../base/icons/svg';
import { getParticipantById, hasRaisedHand } from '../../../base/participants/functions';
import BaseIndicator from '../../../base/react/components/native/BaseIndicator';

import styles from './styles';


/**
 * Thumbnail badge showing that the participant would like to speak.
 *
 * @augments Component
 */
class RaisedHandIndicator extends Component {

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        if (!this.props._raisedHand) {
            return null;
        }

        return this._renderIndicator();
    }

    /**
     * Renders the platform specific indicator element.
     *
     * @returns {React$Element<*>}
     */
    _renderIndicator() {
        return (
            <View style = { styles.raisedHandIndicator }>
                <BaseIndicator
                    icon = { IconRaiseHand }
                    iconStyle = { styles.raisedHandIcon } />
            </View>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {IProps} ownProps - The own props of the component.
 * @returns {Object}
 */
function _mapStateToProps(state, ownProps) {
    const participant = getParticipantById(state, ownProps.participantId);

    return {
        _raisedHand: hasRaisedHand(participant)
    };
}

export default connect(_mapStateToProps)(RaisedHandIndicator);
