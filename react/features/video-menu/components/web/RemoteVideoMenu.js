/* @flow */

import React, { Component } from 'react';

import { connect } from '../../../base/redux';

/**
 * The type of the React {@code Component} props of {@link RemoteVideoMenu}.
 */
type Props = {

    /**
     * The components to place as the body of the {@code RemoteVideoMenu}.
     */
    children: React$Node,

    /**
     * The id attribute to be added to the component's DOM for retrieval when
     * querying the DOM. Not used directly by the component.
     */
    id: string
};

/**
 * React {@code Component} responsible for displaying other components as a menu
 * for manipulating remote participant state.
 *
 * @extends {Component}
 */
class RemoteVideoMenu extends Component<Props> {
    constructor(props) {
        super(props);
        this._menuRef = React.createRef();
    }

    componentDidMount() {
        const { _timer } = this.props;

        if (_timer) {
            this._menuRef.current.addEventListener('mouseenter', _timer.pause);
            this._menuRef.current.addEventListener('mouseleave', _timer.resume);
        }
    }

    componentWillUnmount() {
        const { _timer } = this.props;
        _timer?.resume();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <ul
                className = 'popupmenu'
                id = { this.props.id }
                ref = { this._menuRef }>
                { this.props.children }
            </ul>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code RemoteVideoMenu}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Object}
 */
function _mapStateToProps(state) {
    return {
        _timer: state['features/toolbox'].timer,
    };
}

export default connect(_mapStateToProps)(RemoteVideoMenu);
