import React, { Component } from 'react';

import Container from './Container';

/**
 * Implements a React/Web {@link Component} for displaying a list with
 * sections similar to React Native's {@code SectionList} in order to
 * facilitate cross-platform source code.
 *
 * @augments Component
 */
export default class SectionList extends Component {
    /**
     * Renders the content of this component.
     *
     * @returns {React.ReactNode}
     */
    render() {
        const {
            ListEmptyComponent,
            renderSectionHeader,
            renderItem,
            sections,
            keyExtractor
        } = this.props;

        /**
         * If there are no recent items we don't want to display anything.
         */
        if (sections) {
            return (
                <Container
                    className = 'navigate-section-list'>
                    {
                        sections.length === 0
                            ? ListEmptyComponent
                            : sections.map((section, sectionIndex) => (
                                <Container
                                    key = { sectionIndex }>
                                    { renderSectionHeader(section) }
                                    { section.data
                                        .map((item, listIndex) => {
                                            const listItem = {
                                                item
                                            };

                                            return renderItem(listItem,
                                                keyExtractor(section,
                                                    listIndex));
                                        }) }
                                </Container>
                            )
                            )
                    }
                </Container>
            );
        }

        return null;
    }
}
