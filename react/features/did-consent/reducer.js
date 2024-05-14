// @flow

import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    PERMIT_DATA_REQUEST,
} from './actionTypes';

/**
 * The name of the redux store/state property which is the root of the redux
 * state of the feature {@code did-consent}.
 */
const STORE_NAME = 'features/did-consent';

const DEFAULT_STATE = {

    /**
     * Flag indicating that permit data request.
     *
     * @public
     * @type {boolean}
     */
    permit: undefined,
};

/**
 * Reduces redux actions for the purposes of the feature {@code did-consent}.
 */
ReducerRegistry.register(STORE_NAME, (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case PERMIT_DATA_REQUEST: {
        return {
            ...state,
            permit: action.permit,
        };
    }
    }

    return state;
});
