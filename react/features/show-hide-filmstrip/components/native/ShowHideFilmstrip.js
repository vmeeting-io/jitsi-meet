// @flow

import React, { Component } from 'react';
import { SafeAreaView, Text, View } from 'react-native';

import { translate } from '../../../base/i18n';
import {
    getParticipantById,
    getParticipantDisplayName,
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { ASPECT_RATIO_NARROW } from '../../../base/responsive-ui';

import styles from './styles';


/**
 * Renders a label with the display name of the on-stage participant.
 */
class ShowHideFilmstrip extends Component<Props> {
    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _aspectRatio } = this.props;
        
        const isNarrowAspectRatio = _aspectRatio === ASPECT_RATIO_NARROW;
        const filmstripStyle = isNarrowAspectRatio ? styles.filmstripNarrow : styles.filmstripWide;
        
        const filmstripIcon = isNarrowAspectRatio ? "V" : "VVVV";
        console.log("vmchg: orientation ", filmstripStyle);
        return (
            <SafeAreaView style = { filmstripStyle }>
                <View style = { styles.displayNameBackdrop }>
                    <Text
                        numberOfLines = { 1 }
                        style = { styles.displayNameText }>
                    { filmstripIcon }
                    </Text>
                </View>
            </SafeAreaView>
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
function _mapStateToProps(state: Object) {
    //Do some processing here with state variable to know if the 
    //phone is in portrait or landscape mode. Based on this change
    //icon.
    const { aspectRatio } = state['features/base/responsive-ui'];
    return {
        _aspectRatio: aspectRatio
    };
}

export default translate(connect(_mapStateToProps)(ShowHideFilmstrip));
