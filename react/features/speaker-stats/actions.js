// @flow

import axios from 'axios';
import type { Dispatch } from 'redux';

import { getAuthUrl } from '../../api/url';

import { 
    SPEAKER_STATS_ADDED,
    SPEAKER_STATS_LOADED,
    SPEAKER_STATS_UPDATED,
} from './actionTypes';

export function loadSpeakerStats(meetingId) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const apiBase = getAuthUrl(getState());
        const apiUrl = `${apiBase}/plog?meeting_id=${meetingId}`;

        try {
            const logs = await axios.get(apiUrl);
            //console.log('loadSpeakerStats:', logs.data);
            dispatch(speakerStatsLoaded(logs.data));
        } catch(err) {    
            console.log('loadSpeakerStats is failed:', err);
        }    
    };
}

export function speakerStatsLoaded(data: Array) {
    return {
        type: SPEAKER_STATS_LOADED,
        data
    };
}

export function speakerStatsUpdated(item: Object) {
    return {
        type: SPEAKER_STATS_UPDATED,
        item
    };
}

export function speakerStatsAdded(item: Object) {
    return {
        type: SPEAKER_STATS_ADDED,
        item
    };
}
