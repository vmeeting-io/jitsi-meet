// @flow

import React, { useCallback } from 'react';
import { Text, TouchableHighlight, View } from 'react-native';

import { Avatar } from '../../../base/avatar';
import { Icon, IconCheck } from '../../../base/icons';
import { getParticipantById, getParticipantDisplayName } from '../../../base/participants';
import { connect } from '../../../base/redux';

/**
 * An implementation of a button to raise or lower hand.
 */
function ParticipantItem(props) {
    const { _isFakeParticipant, className, name, participantID, selected, onClick, styles } = props;

    if (_isFakeParticipant) {
        return null;
    }

    // XXX When using a wrapper View, apply the style to it instead of
    // applying it to the TouchableHighlight.
    let style = styles && styles.style;

    const renderAvatar = useCallback(() => {
        return <Avatar participantId = { participantID } size = { 24 } />;
    }, [participantID]);

    const renderChecked = useCallback(() => {
        return !selected ? null : (
            <Icon
                src = { IconCheck }
                color = 'white'
                style = { styles && styles.checkStyle } />
        );
    }, [selected, styles]);

    let children = (
        <View style = {{
            ...style,
            backgroundColor: selected ? 'rgba(255,255,255,0.1)' : undefined
        }}>
            { renderAvatar() }
            <Text style = { styles && styles.labelStyle }>
                { name }
            </Text>
            { renderChecked() }
        </View>
    );

    return (
        <TouchableHighlight
            accessibilityRole = 'button'
            accessibilityState = {{ 'selected': selected }}
            className = { className }
            onPress = { onClick }
            underlayColor = { styles && styles.underlayColor } >
            { children }
        </TouchableHighlight>
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
