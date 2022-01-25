// @flow

import React, { useCallback } from 'react';
import { Text, TouchableHighlight, View } from 'react-native';

import { Avatar } from '../../../base/avatar';
import { Icon, IconCheck } from '../../../base/icons';

/**
 * An implementation of a button to raise or lower hand.
 */
function ParticipantItem(props) {
    const { className, name, id, selected, onClick, styles } = props;

    // XXX When using a wrapper View, apply the style to it instead of
    // applying it to the TouchableHighlight.
    let style = styles && styles.style;

    const renderAvatar = useCallback(() => {
        return <Avatar participantId = { id } size = { 24 } />;
    }, [id]);

    const renderChecked = useCallback(() => {
        return !selected ? null : (
            <Icon
                src = { IconCheck }
                style = { styles && styles.checkStyle } />
        );
    }, [selected, styles]);

    let children = (
        <View style = { style }>
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

export default ParticipantItem;
