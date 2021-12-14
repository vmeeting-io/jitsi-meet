// @flow

import React, { Component } from 'react';
import { TouchableHighlight } from 'react-native';

/**
 * A container to hold video status labels, including recording status and
 * current large video quality.
 *
 * @extends Component
 */
export default class PageButton extends Component {
    /**
     * Initializes a new {@code PageNextButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
     constructor(props) {
        super(props);

        this.state = {
            current: 1,
            disabled: false
        };

        this.onChangePage = this.onChangePage.bind(this);
    }

    onChangePage() {
    }

    /**
     * Renders the {@code PageButton}.
     *
     * @protected
     * @returns {React$Element}
     */
    render() {
        return (
            <TouchableHighlight
                accessibilityRole = 'button'
                accessibilityState = {{ 'selected': true }}
                disabled = { this.state.disabled }
                onPress = { this.onChangePage }
                style = { undefined }
                underlayColor = 'transparent'>
                { this._renderIcon() }
            </TouchableHighlight>
        );
    }
}
