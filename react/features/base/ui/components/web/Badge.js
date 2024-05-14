import React, { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Implements a React {@link Component} which displays a badge component.
 *
 * @augments Component
 */
class Badge extends Component {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <span className = 'badge-round'>
                <span>{this.props.children}</span>
            </span>
        );
    }
}

export default connect()(ChatCounter);
