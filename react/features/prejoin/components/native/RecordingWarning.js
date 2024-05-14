import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { preJoinStyles as styles } from './styles';


const RecordingWarning = () => {
    const { t } = useTranslation();

    return (
        <View style = { styles.recordingWarning }>
            <Text
                numberOfLines = { 1 }
                style = { styles.recordingWarningText }>
                { t('prejoin.recordingWarning') }
            </Text>
        </View>
    );
};

export default RecordingWarning;
