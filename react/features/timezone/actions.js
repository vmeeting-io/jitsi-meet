import { updateTimezone } from '../../api/AuthApi';
import { setJWT } from '../base/jwt/actions';

export function setTimezone(timezone) {
    return async function(dispatch, getState) {
        try {
            const state = getState();
            const { data: token } = await updateTimezone(timezone, state);
            dispatch(setJWT(token));
        } catch (error) {
            console.error(error);
        }
    };
}
