// @flow

import { PersistenceRegistry, ReducerRegistry } from '../base/redux';

import { AR_ENABLED, SET_AR } from './actionTypes';

const STORE_NAME = 'features/ar-effect';

/**
 * Reduces redux actions which activate/deactivate virtual background image, or
 * indicate if the virtual image background is activated/deactivated. The
 * backgroundEffectEnabled flag indicate if virtual background effect is activated.
 *
 * @param {State} state - The current redux state.
 * @param {Action} action - The redux action to reduce.
 * @param {string} action.type - The type of the redux action to reduce..
 * @returns {State} The next redux state that is the result of reducing the
 * specified action.
 */
ReducerRegistry.register(STORE_NAME, (state = {}, action) => {
    const { arSource, arEffectEnabled } = action;

    /**
     * Sets up the persistence of the feature {@code virtual-background}.
     */
    PersistenceRegistry.register(STORE_NAME);

    switch (action.type) {
    case SET_AR: {
        return {
            ...state,
            arSource
            
        };
    }
    case AR_ENABLED: {
        return {
            ...state,
            arEffectEnabled
        };
    }
    }

    return state;
});
