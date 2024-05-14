import React, { PureComponent } from 'react';

import isInsecureRoomName from '../../base/util/isInsecureRoomName';
import { isUnsafeRoomWarningEnabled } from '../../prejoin/functions';

/**
 * Abstract class for the {@Code InsecureRoomNameLabel} component.
 */
export default class AbstractInsecureRoomNameLabel extends PureComponent {
    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        if (!this.props._visible) {
            return null;
        }

        return this._render();
    }

    /**
     * Renders the platform dependent content.
     *
     * @returns {ReactElement}
     */
    _render() {
        return <></>;
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
export function _mapStateToProps(state) {
    const { locked, room } = state['features/base/conference'];
    const { lobbyEnabled } = state['features/lobby'];

    return {
        _visible: Boolean(isUnsafeRoomWarningEnabled(state)
            && room && isInsecureRoomName(room)
            && !(lobbyEnabled || Boolean(locked)))
    };
}
