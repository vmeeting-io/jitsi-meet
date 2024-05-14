import ReducerRegistry from '../base/redux/ReducerRegistry';

import { TOGGLE_SHARE_DIALOG } from './actionTypes';

const DEFAULT_STATE = {
    shareDialogVisible: false
};

ReducerRegistry.register('features/share-room', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case TOGGLE_SHARE_DIALOG:
        return {
            ...state,
            shareDialogVisible: action.visible
        };
    }

    return state;
});
