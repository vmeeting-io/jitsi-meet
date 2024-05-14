import React, { Component } from 'react';

/**
 * Implements a React {@link Component} for the frame of the overlays.
 */
export default class OverlayFrame extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
        return (
            <div
                className = { this.props.isLightOverlay ? 'overlay__container-light' : 'overlay__container' }
                id = 'overlay'
                style = { this.props.style }>
                <div className = { 'overlay__content' }>
                    {
                        this.props.children
                    }
                </div>
            </div>
        );
    }
}
