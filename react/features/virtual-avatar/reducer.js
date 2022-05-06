// @flow

import { PersistenceRegistry, ReducerRegistry } from '../base/redux';

import { VIRTUAL_AVATAR_ENABLED, SET_VIRTUAL_AVATAR } from './actionTypes';

const STORE_NAME = 'features/virtual-avatar';

/**
 * Reduces redux actions which activate/deactivate virtual avatar, or
 * indicate if the virtual avatar is activated/deactivated. The
 * virtualAvatarEffectEnabled flag indicate if virtual avatar effect is activated.
 *
 * @param {State} state - The current redux state.
 * @param {Action} action - The redux action to reduce.
 * @param {string} action.type - The type of the redux action to reduce..
 * @returns {State} The next redux state that is the result of reducing the
 * specified action.
 */
ReducerRegistry.register(STORE_NAME, (state = {}, action) => {
    const { virtualAvatarEffectEnabled, virtualAvatarType, selectedVirtualAvatarUrl, selectedBackgroundUrl, selectedBackgroundId } = action;

    /**
     * Sets up the persistence of the feature {@code virtual-avatar}.
     */
    PersistenceRegistry.register(STORE_NAME, true);

    switch (action.type) {
        case SET_VIRTUAL_AVATAR: {
        return {
            ...state,
            virtualAvatarType,
            selectedVirtualAvatarUrl,
            selectedBackgroundUrl,
            selectedBackgroundId
        };
    }
    case VIRTUAL_AVATAR_ENABLED: {
        return {
            ...state,
            virtualAvatarEffectEnabled
        };
    }
    }

    return state;
});
