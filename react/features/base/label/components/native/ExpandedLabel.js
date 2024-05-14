import React, { Component } from 'react';
import { Animated, Text, View } from 'react-native';

import styles, { DEFAULT_COLOR } from './styles';

/**
 * A react {@code Component} that implements an expanded label as tooltip-like
 * component to explain the meaning of the {@code Label}.
 */
export default class ExpandedLabel extends Component {
    /**
     * Instantiates a new {@code ExpandedLabel} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this.state = {
            opacityAnimation: new Animated.Value(0)
        };
    }

    /**
     * Implements React {@code Component}'s componentDidMount.
     *
     * @inheritdoc
     */
    componentDidMount() {
        Animated.decay(this.state.opacityAnimation, {
            toValue: 1,
            velocity: 1,
            useNativeDriver: true
        }).start();
    }

    /**
     * Implements React {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        return (
            <Animated.View
                style = { [ styles.expandedLabelContainer,
                    this.props.style,
                    { opacity: this.state.opacityAnimation }
                ] }>
                <View
                    style = { [ styles.expandedLabelTextContainer,
                        { backgroundColor: this._getColor() || DEFAULT_COLOR } ] }>
                    <Text style = { styles.expandedLabelText }>
                        { this._getLabel() }
                    </Text>
                </View>
            </Animated.View>
        );
    }

    /**
     * Returns the label that needs to be rendered in the box. To be implemented
     * by its overriding classes.
     *
     * @returns {string}
     */
    _getLabel() {
        // To be implemented by subclass.
    }

    /**
     * Defines the color of the expanded label. This function returns a default
     * value if implementing classes don't override it, but the goal is to have
     * expanded labels matching to circular labels in color.
     * If implementing classes return a falsy value, it also uses the default
     * color.
     *
     * @returns {string}
     */
    _getColor() {
        return DEFAULT_COLOR;
    }
}
