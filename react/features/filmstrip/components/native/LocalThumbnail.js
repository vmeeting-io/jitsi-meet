// @flow

import React from 'react';
import { View } from 'react-native';

import Thumbnail from './Thumbnail';
import styles from './styles';

export default function LocalThumbnail() {
    return (
        <View style = { styles.localThumbnail }>
            <Thumbnail />
        </View>
    );
}

