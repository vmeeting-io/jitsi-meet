import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { hideNotification } from '../../actions';
import { areThereNotifications } from '../../functions';
import NotificationsTransition from '../NotificationsTransition';

import Notification from './Notification';

const useStyles = makeStyles()(() => {
    return {
        container: {
            position: 'absolute',
            left: '16px',
            bottom: '84px',
            width: '320px',
            maxWidth: '100%',
            zIndex: 600
        },

        containerPortal: {
            width: '100%',
            maxWidth: 'calc(100% - 32px)'
        }
    };
});

const NotificationsContainer = ({
    _iAmSipGateway,
    _notifications,
    dispatch,
    portal
}) => {
    const { classes, cx } = useStyles();

    const _onDismissed = useCallback((uid: string) => {
        dispatch(hideNotification(uid));
    }, []);

    if (_iAmSipGateway) {
        return null;
    }

    return (
        <div
            className = { cx(classes.container, {
                [classes.containerPortal]: portal
            }) }
            id = 'notifications-container'>
            <NotificationsTransition>
                {_notifications.map(({ props, uid }) => (
                    <Notification
                        { ...props }
                        key = { uid }
                        onDismissed = { _onDismissed }
                        uid = { uid } />
                )) || null}
            </NotificationsTransition>
        </div>
    );
};

/**
 * Maps (parts of) the Redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state) {
    const { notifications } = state['features/notifications'];
    const { iAmSipGateway } = state['features/base/config'];
    const { isOpen: isChatOpen } = state['features/chat'];
    const _visible = areThereNotifications(state);

    return {
        _iAmSipGateway: Boolean(iAmSipGateway),
        _isChatOpen: isChatOpen,
        _notifications: _visible ? notifications : []
    };
}

export default connect(_mapStateToProps)(NotificationsContainer);
