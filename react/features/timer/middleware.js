// @flow

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app/actionTypes';

import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { registerSound, unregisterSound } from '../base/sounds/actions';

import { TIMER_OFF_SOUND_ID } from './constants';
import { TIMER_OFF_SOUND_FILE } from './sounds';

/**
 * Middleware that captures actions related to Timer.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    switch (action.type) {
        case APP_WILL_MOUNT:
            dispatch(registerSound(
                TIMER_OFF_SOUND_ID, TIMER_OFF_SOUND_FILE));
            break;
        case APP_WILL_UNMOUNT:
            dispatch(unregisterSound(TIMER_OFF_SOUND_ID));
            break;
    }
    return next(action);
});
