import ReducerRegistry from '../redux/ReducerRegistry';

import { SET_LAST_N } from './actionTypes';

ReducerRegistry.register('features/base/lastn', (state = {}, action) => {
    switch (action.type) {
    case SET_LAST_N: {
        const { lastN } = action;

        return {
            ...state,
            lastN
        };
    }
    }

    return state;
});
