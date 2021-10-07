// @flow

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated , View, Image, StyleSheet} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { removeReaction } from '../../actions.any';
import { REACTIONS, type ReactionEmojiProps } from '../../constants';


type Props = ReactionEmojiProps & {

    /**
     * Index of reaction on the queue.
     * Used to differentiate between first and other animations.
     */
    index: number
};


/**
 * Animated reaction emoji.
 *
 * @returns {ReactElement}
 */
function ReactionEmoji({ reaction, uid, index }: Props) {
    const _height = useSelector(state => state['features/base/responsive-ui'].clientHeight);
    const dispatch = useDispatch();

    const vh = useState(_height / 100)[0];

    const styles = StyleSheet.create({
        icon: {
          marginLeft: 10,
          marginTop: _height - 200,
          height: 90,
          width: 90,
        }, 
      });


    useEffect(() => {
        setTimeout(() => dispatch(removeReaction(uid)), 5000);
    }, []);
    return (
        <View>
                <Image style={styles.icon} source={REACTIONS[reaction].animoji} /> 
        </View>
    );
}

export default ReactionEmoji;
