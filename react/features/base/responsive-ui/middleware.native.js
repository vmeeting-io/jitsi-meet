// @flow

import { MiddlewareRegistry } from '../../base/redux';

import { CLIENT_RESIZED } from './actionTypes';
import { setAspectRatio, setReducedUI } from './actions';
import { setPagination } from '../../video-layout';


/**
 * Middleware that handles widnow dimension changes and updates the aspect ratio and
 * reduced UI modes accordingly.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch }) => next => action => {
    const result = next(action);

    switch (action.type) {
    case CLIENT_RESIZED: {
        const { clientWidth: width, clientHeight: height } = action;

        dispatch(setAspectRatio(width, height));
        dispatch(setReducedUI(width, height));
        dispatch(setPagination());
        break;
    }

    }

    return result;
});
