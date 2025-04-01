import { SET_TIMEZONE } from './actionTypes';

export function setTimezone(timezone) {
    return {
        type: SET_TIMEZONE,
        timezone
    };
}
