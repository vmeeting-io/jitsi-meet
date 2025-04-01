import moment from 'moment';
import { toState } from '../base/redux/functions';

export function getTimezoneOffset(stateful) {
    const state = toState(stateful);
    const { user } = state['features/base/jwt'];

    if (!user?.timezone) {
        return moment().utcOffset();
    }

    const parsed = /^\(GMT(.)(\d+):(\d+)\)$/.exec(user.timezone.utc);
    if (!parsed) {
        console.warn('Invalid timezone format', user.timezone.utc);
        return moment().utcOffset();
    }

    const [ _, sign, hour, minute ] = parsed;
    const offset = (sign === '+' ? 1 : -1) * (parseInt(hour) * 60 + parseInt(minute));

    return offset;
}
