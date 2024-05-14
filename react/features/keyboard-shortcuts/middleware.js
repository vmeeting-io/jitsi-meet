// @flow

import { SET_CONFIG } from '../base/config/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { CAPTURE_EVENTS } from '../remote-control/actionTypes';

import { disableKeyboardShortcuts, enableKeyboardShortcuts } from './actions.any';

/**
 * Implements the middleware of the feature keyboard-shortcuts.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    const { dispatch } = store;

    switch (action.type) {
    case CAPTURE_EVENTS:
        if (action.isCapturingEvents) {
            dispatch(disableKeyboardShortcuts());
        } else {
            dispatch(enableKeyboardShortcuts());
        }

        return next(action);
    case SET_CONFIG: {
        const result = next(action);

        const state = store.getState();
        const { disableShortcuts } = state['features/base/config'];

        if (disableShortcuts !== undefined) {
            if (disableShortcuts) {
                dispatch(disableKeyboardShortcuts());
            } else {
                dispatch(enableKeyboardShortcuts());
            }
        }

        return result;
    }
    }

    return next(action);
});
