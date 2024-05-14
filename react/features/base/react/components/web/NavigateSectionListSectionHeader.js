import React, { Component } from 'react';

import Text from './Text';

/**
 * Implements a React/Web {@link Component} that renders the section header of
 * the list.
 *
 * @augments Component
 */
export default class NavigateSectionListSectionHeader extends Component {
    /**
     * Renders the content of this component.
     *
     * @returns {ReactElement}
     */
    render() {
        return (
            <Text className = 'navigate-section-section-header'>
                { this.props.section.title }
            </Text>
        );
    }
}
