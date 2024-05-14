// @flow

import {
    CONFERENCE_JOINED,
    CONFERENCE_TIMESTAMP_CHANGED,
    E2E_RTT_CHANGED
} from '../base/conference/actionTypes';
import { DOMINANT_SPEAKER_CHANGED } from '../base/participants/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { TRACK_ADDED, TRACK_UPDATED } from '../base/tracks/actionTypes';
import { sendGetCustomerIdRequest } from '../jaas/functions';

import RTCStats from './RTCStats';
import { isRTCStatsEnabled } from './functions';
import logger from './logger';

/**
 * Middleware which intercepts lib-jitsi-meet initialization and conference join in order init the
 * rtcstats-client.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const { getState } = store;
    const state = getState();

    switch (action.type) {
    case CONFERENCE_JOINED: {
        if (isRTCStatsEnabled(state)) {
            RTCStats.init();

            sendGetCustomerIdRequest(action?.conference, state)
                .then(customerData => {
                    const { customerId } = customerData ?? {};

                    customerId && RTCStats.sendIdentityData({ customerId });
                })
                .catch(error => {
                    logger.error('Error while getting customer id:', error);
                });
        }
        break;
    }
    case TRACK_ADDED: {
        if (isRTCStatsEnabled(state)) {
            const jitsiTrack = action?.track?.jitsiTrack;
            const { ssrc, videoType } = jitsiTrack || { };

            // Remote tracks store their ssrc in the jitsiTrack object. Local tracks don't. See getSsrcByTrack.
            if (videoType && ssrc && !jitsiTrack.isLocal() && !jitsiTrack.isAudioTrack()) {
                RTCStats.sendVideoTypeData({
                    ssrc,
                    videoType
                });
            }
        }
        break;
    }
    case TRACK_UPDATED: {
        if (isRTCStatsEnabled(state)) {
            const { videoType, jitsiTrack, muted } = action?.track || { };
            const { ssrc, isLocal, videoType: trackVideoType, conference } = jitsiTrack || { };

            // if (trackVideoType === 'camera' && conference && isLocal()) {
            //     RTCStats.sendFaceLandmarksData({
            //         duration: 0,
            //         faceLandmarks: muted ? 'camera-off' : 'camera-on',
            //         timestamp: Date.now()
            //     });
            // }

            // if the videoType of the remote track has changed we expect to find it in track.videoType. grep for
            // trackVideoTypeChanged.
            if (videoType && ssrc && !jitsiTrack.isLocal() && !jitsiTrack.isAudioTrack()) {

                RTCStats.sendVideoTypeData({
                    ssrc,
                    videoType
                });
            }
        }
        break;
    }
    case DOMINANT_SPEAKER_CHANGED: {
        if (isRTCStatsEnabled(state)) {
            const { id, previousSpeakers, silence } = action.participant;

            RTCStats.sendDominantSpeakerData({
                dominantSpeakerEndpoint: silence ? null : id,
                previousSpeakers
            });
        }
        break;
    }
    case E2E_RTT_CHANGED: {
        if (isRTCStatsEnabled(state)) {
            const { participant, rtt } = action.e2eRtt;

            RTCStats.sendE2ERTTData({
                remoteEndpointId: participant.getId(),
                rtt,
                remoteRegion: participant.getProperty('region')
            });
        }
        break;
    }
    case CONFERENCE_TIMESTAMP_CHANGED: {
        if (isRTCStatsEnabled(state)) {
            const { conferenceTimestamp } = action;

            RTCStats.sendConferenceTimestamp(conferenceTimestamp);
        }
        break;
    }
    }

    return next(action);
});
