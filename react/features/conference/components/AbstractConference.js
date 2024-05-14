import React, { Component } from 'react';

import { NotificationsContainer } from '../../notifications/components';
import { shouldDisplayTileView } from '../../video-layout/functions.any';
import { shouldDisplayNotifications } from '../functions';

/**
 * A container to hold video status labels, including recording status and
 * current large video quality.
 *
 * @augments Component
 */
export class AbstractConference extends Component {

    /**
     * Renders the {@code LocalRecordingLabel}.
     *
     * @param {Object} props - The properties to be passed to
     * the {@code NotificationsContainer}.
     * @protected
     * @returns {React$Element}
     */
    renderNotificationsContainer(props) {
        if (this.props._notificationsVisible) {
            return (
                React.createElement(NotificationsContainer, props)
            );
        }

        return null;
    }
}

/**
 * Maps (parts of) the redux state to the associated props of the {@link Labels}
 * {@code Component}.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {AbstractProps}
 */
export function abstractMapStateToProps(state) {
    return {
        _notificationsVisible: shouldDisplayNotifications(state),
        _room: state['features/base/conference'].room ?? '',
        _shouldDisplayTileView: shouldDisplayTileView(state)
    };
}
