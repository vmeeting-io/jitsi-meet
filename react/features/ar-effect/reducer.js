// @flow

import { PersistenceRegistry, ReducerRegistry } from '../base/redux';

import { AR_ENABLED, SET_AR, AR_APPROVAL_DIALOG } from './actionTypes';

/**
 * The default/initial redux state of the feature {@code base/settings}.
 *
 * @type Object
 */
const DEFAULT_STATE = {
    arApprovalDialog: true,
    arEffectEnabled: false
}

const STORE_NAME = 'features/ar-effect';

/**
 * Sets up the persistence of the feature {@code base/settings}.
 */
const filterSubtree = {};

// start with the default state
Object.keys(DEFAULT_STATE).forEach(key => {
    filterSubtree[key] = true;
});

// we want to filter these props, to not be stored as they represent
// what is currently opened/used as devices
// filterSubtree.audioOutputDeviceId = false;
// filterSubtree.cameraDeviceId = false;
// filterSubtree.micDeviceId = false;

PersistenceRegistry.register(STORE_NAME, filterSubtree, DEFAULT_STATE);
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
    const { arSource, arEffectEnabled, arApprovalDialog } = action;

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
    case AR_APPROVAL_DIALOG: {
        console.log("ANIS: REDUCER");
        return {
            ...state,
            arApprovalDialog
        };
    }
    }

    return state;
});
