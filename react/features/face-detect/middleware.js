// @flow

import {
    CONNECTION_ESTABLISHED,
} from '../base/connection';
import { MiddlewareRegistry } from '../base/redux';
import { startFaceDetect } from './actions';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONNECTION_ESTABLISHED:
        return _connectionEstablished(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature app that the action {@link CONNECTION_ESTABLISHED} is
 * being dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code CONNECTION_ESTABLISHED}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _connectionEstablished(store, next, action) {
    const result = next(action);

    store.dispatch(startFaceDetect());

    return result;
}
