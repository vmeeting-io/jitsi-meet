import { PersistenceRegistry, ReducerRegistry } from '../base/redux';

import {
    SET_TIMEZONE,
} from './actionTypes';

const STORE_NAME = 'features/timezone';

PersistenceRegistry.register(STORE_NAME, {
    timezone: null
});

ReducerRegistry.register(STORE_NAME, (state = {}, action) => {
    switch (action.type) {
        case SET_TIMEZONE:
            return {
                timezone: action.timezone
            };
    }

    return state;
});
