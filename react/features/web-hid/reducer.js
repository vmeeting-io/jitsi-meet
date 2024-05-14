import ReducerRegistry from '../base/redux/ReducerRegistry';

import { CLOSE_HID_DEVICE, INIT_DEVICE, UPDATE_DEVICE } from './actionTypes';

/**
 * The initial state of the web-hid feature.
*/
const DEFAULT_STATE = {
    deviceInfo: {}
};


ReducerRegistry.register(
'features/web-hid',
(state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case INIT_DEVICE:
        return {
            ...state,
            deviceInfo: action.deviceInfo
        };
    case UPDATE_DEVICE:
        return {
            ...state,
            deviceInfo: {
                ...state.deviceInfo,
                ...action.updates
            }
        };
    case CLOSE_HID_DEVICE:
        return {
            ...state,
            deviceInfo: DEFAULT_STATE.deviceInfo
        };
    default:
        return state;
    }
});
