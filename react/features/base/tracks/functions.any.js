/* global APP */

import { JitsiTrackErrors, browser } from '../lib-jitsi-meet';
import {
    CAMERA_FACING_MODE,
    MEDIA_TYPE,
    MediaType,
    VIDEO_TYPE,
    gumPending,
} from '../media';
import { IGUMPendingState } from '../media/types';
import {
    getVirtualScreenshareParticipantOwnerId,
    isScreenShareParticipant
} from '../participants/functions';

import logger from './logger';

/**
 * Returns root tracks state.
 *
 * @param {Object} state - Global state.
 * @returns {Object} Tracks state.
 */
export const getTrackState = state => state['features/base/tracks'];

/**
 * Checks if the passed media type is muted for the participant.
 *
 * @param {Object} participant - Participant reference.
 * @param {MEDIA_TYPE} mediaType - Media type.
 * @param {Object} state - Global state.
 * @returns {boolean} - Is the media type muted for the participant.
 */
export function isParticipantMediaMuted(participant, mediaType, state) {
    if (!participant) {
        return false;
    }

    const tracks = getTrackState(state);

    if (participant?.local) {
        return isLocalTrackMuted(tracks, mediaType);
    } else if (!participant?.fakeParticipant) {
        return isRemoteTrackMuted(tracks, mediaType, participant.id);
    }

    return true;
}

/**
 * Checks if the participant is audio muted.
 *
 * @param {Object} participant - Participant reference.
 * @param {Object} state - Global state.
 * @returns {boolean} - Is audio muted for the participant.
 */
export function isParticipantAudioMuted(participant, state) {
    return isParticipantMediaMuted(participant, MEDIA_TYPE.AUDIO, state);
}

/**
 * Checks if the participant is video muted.
 *
 * @param {Object} participant - Participant reference.
 * @param {Object} state - Global state.
 * @returns {boolean} - Is video muted for the participant.
 */
export function isParticipantVideoMuted(participant, state) {
    return isParticipantMediaMuted(participant, MEDIA_TYPE.VIDEO, state);
}

/**
 * Returns local audio track.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @returns {(Track|undefined)}
 */
export function getLocalAudioTrack(tracks) {
    return getLocalTrack(tracks, MEDIA_TYPE.AUDIO);
}

/**
 * Returns the local desktop track.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {boolean} [includePending] - Indicates whether a local track is to be returned if it is still pending.
 * A local track is pending if {@code getUserMedia} is still executing to create it and, consequently, its
 * {@code jitsiTrack} property is {@code undefined}. By default a pending local track is not returned.
 * @returns {(Track|undefined)}
 */
export function getLocalDesktopTrack(tracks, includePending = false) {
    return (
        getLocalTracks(tracks, includePending)
            .find(t => t.mediaType === MEDIA_TYPE.SCREENSHARE || t.videoType === VIDEO_TYPE.DESKTOP));
}

/**
 * Returns the stored local desktop jitsiLocalTrack.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {JitsiLocalTrack|undefined}
 */
export function getLocalJitsiDesktopTrack(state) {
    const track = getLocalDesktopTrack(getTrackState(state));

    return track?.jitsiTrack;
}

/**
 * Returns local track by media type.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {MEDIA_TYPE} mediaType - Media type.
 * @param {boolean} [includePending] - Indicates whether a local track is to be
 * returned if it is still pending. A local track is pending if
 * {@code getUserMedia} is still executing to create it and, consequently, its
 * {@code jitsiTrack} property is {@code undefined}. By default a pending local
 * track is not returned.
 * @returns {(Track|undefined)}
 */
export function getLocalTrack(tracks, mediaType, includePending = false) {
    return (
        getLocalTracks(tracks, includePending)
            .find(t => t.mediaType === mediaType));
}

/**
 * Returns an array containing the local tracks with or without a (valid)
 * {@code JitsiTrack}.
 *
 * @param {Track[]} tracks - An array containing all local tracks.
 * @param {boolean} [includePending] - Indicates whether a local track is to be
 * returned if it is still pending. A local track is pending if
 * {@code getUserMedia} is still executing to create it and, consequently, its
 * {@code jitsiTrack} property is {@code undefined}. By default a pending local
 * track is not returned.
 * @returns {Track[]}
 */
export function getLocalTracks(tracks, includePending = false) {
    // XXX A local track is considered ready only once it has its `jitsiTrack`
    // property set by the `TRACK_ADDED` action. Until then there is a stub
    // added just before the `getUserMedia` call with a cancellable
    // `gumInProgress` property which then can be used to destroy the track that
    // has not yet been added to the redux store. Once GUM is cancelled, it will
    // never make it to the store nor there will be any
    // `TRACK_ADDED`/`TRACK_REMOVED` actions dispatched for it.
    return tracks.filter(t => t.local && (t.jitsiTrack || includePending));
}

/**
 * Returns local video track.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @returns {(Track|undefined)}
 */
export function getLocalVideoTrack(tracks) {
    return getLocalTrack(tracks, MEDIA_TYPE.VIDEO);
}

/**
 * Returns the stored local video track.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
export function getLocalJitsiVideoTrack(state) {
    const track = getLocalVideoTrack(getTrackState(state));

    return track?.jitsiTrack;
}

/**
 * Returns the stored local audio track.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
export function getLocalJitsiAudioTrack(state) {
    const track = getLocalAudioTrack(getTrackState(state));

    return track?.jitsiTrack;
}

/**
 * Returns track of specified media type for specified participant.
 *
 * @param {IReduxState} state - The redux state.
 * @param {IParticipant} participant - Participant Object.
 * @returns {(Track|undefined)}
 */
export function getVideoTrackByParticipant(state, participant) {

    if (!participant) {
        return;
    }

    const tracks = state['features/base/tracks'];

    if (isScreenShareParticipant(participant)) {
        return getVirtualScreenshareParticipantTrack(tracks, participant.id);
    }

    return getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, participant.id);
}

/**
 * Returns track of specified media type for specified participant id.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {MEDIA_TYPE} mediaType - Media type.
 * @param {string} participantId - Participant ID.
 * @returns {(Track|undefined)}
 */
export function getTrackByMediaTypeAndParticipant(
        tracks,
        mediaType,
        participantId) {
    return tracks.find(
        t => Boolean(t.jitsiTrack) && t.participantId === participantId && t.mediaType === mediaType
    );
}

/**
 * Returns track for specified participant id.
 *
 * @param {ITrack[]} tracks - List of all tracks.
 * @param {string} participantId - Participant ID.
 * @returns {(Track[]|undefined)}
 */
export function getTrackByParticipantId(tracks, participantId) {
    return tracks.filter(t => t.participantId === participantId);
}

/**
 * Returns screenshare track of given virtualScreenshareParticipantId.
 *
 * @param {ITrack[]} tracks - List of all tracks.
 * @param {string} virtualScreenshareParticipantId - Virtual Screenshare Participant ID.
 * @returns {(Track|undefined)}
 */
export function getVirtualScreenshareParticipantTrack(tracks, virtualScreenshareParticipantId) {
    const ownderId = getVirtualScreenshareParticipantOwnerId(virtualScreenshareParticipantId);

    return getScreenShareTrack(tracks, ownderId);
}

/**
 * Returns screenshare track of given owner ID.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {string} ownerId - Screenshare track owner ID.
 * @returns {(Track|undefined)}
 */
export function getScreenShareTrack(tracks, ownerId) {
    return tracks.find(
        t => Boolean(t.jitsiTrack)
        && t.participantId === ownerId
        && (t.mediaType === MEDIA_TYPE.SCREENSHARE || t.videoType === VIDEO_TYPE.DESKTOP)
    );
}

/**
 * Returns track source name of specified media type for specified participant id.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {MEDIA_TYPE} mediaType - Media type.
 * @param {string} participantId - Participant ID.
 * @returns {(string|undefined)}
 */
export function getTrackSourceNameByMediaTypeAndParticipant(
        tracks,
        mediaType,
        participantId) {
    const track = getTrackByMediaTypeAndParticipant(
        tracks,
        mediaType,
        participantId);

    return track?.jitsiTrack?.getSourceName();
}

/**
 * Returns the track if any which corresponds to a specific instance
 * of JitsiLocalTrack or JitsiRemoteTrack.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)} jitsiTrack - JitsiTrack instance.
 * @returns {(Track|undefined)}
 */
export function getTrackByJitsiTrack(tracks, jitsiTrack) {
    return tracks.find(t => t.jitsiTrack === jitsiTrack);
}

/**
 * Returns tracks of specified media type.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {MEDIA_TYPE} mediaType - Media type.
 * @returns {Track[]}
 */
export function getTracksByMediaType(tracks, mediaType) {
    return tracks.filter(t => t.mediaType === mediaType);
}

/**
 * Checks if the first local track in the given tracks set is muted.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {MEDIA_TYPE} mediaType - The media type of tracks to be checked.
 * @returns {boolean} True if local track is muted or false if the track is
 * unmuted or if there are no local tracks of the given media type in the given
 * set of tracks.
 */
export function isLocalTrackMuted(tracks, mediaType) {
    const track = getLocalTrack(tracks, mediaType);

    return !track || track.muted;
}

/**
 * Checks if the local video track is of type DESKtOP.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean}
 */
export function isLocalVideoTrackDesktop(state) {
    const desktopTrack = getLocalDesktopTrack(getTrackState(state));

    return desktopTrack !== undefined && !desktopTrack.muted;
}


/**
 * Returns true if the remote track of the given media type and the given
 * participant is muted, false otherwise.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {MEDIA_TYPE} mediaType - The media type of tracks to be checked.
 * @param {*} participantId - Participant ID.
 * @returns {boolean}
 */
export function isRemoteTrackMuted(tracks, mediaType, participantId) {
    const track = getTrackByMediaTypeAndParticipant(tracks, mediaType, participantId);

    return !track || track.muted;
}

/**
 * Returns whether or not the current environment needs a user interaction with
 * the page before any unmute can occur.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean}
 */
export function isUserInteractionRequiredForUnmute(state) {
    return browser.isUserInteractionRequiredForUnmute()
        && window
        && window.self !== window.top
        && !state['features/base/user-interaction'].interacted;
}

/**
 * Sets the GUM pending state for the passed track operation (mute/unmute) and media type.
 * NOTE: We need this only for web.
 *
 * @param {IGUMPendingState} status - The new GUM pending status.
 * @param {MediaType} mediaType - The media type related to the operation (audio or video).
 * @param {boolean} muted - True if the operation is mute and false for unmute.
 * @param {Function} dispatch - The dispatch method.
 * @returns {void}
 */
export function _setGUMPendingState(
    status,
    mediaType,
    muted,
    dispatch) {
    if (!muted && dispatch && typeof APP !== 'undefined') {
        dispatch(gumPending([ mediaType ], status));
    }
}

/**
 * Mutes or unmutes a specific {@code JitsiLocalTrack}. If the muted state of the specified {@code track} is already in
 * accord with the specified {@code muted} value, then does nothing.
 *
 * @param {JitsiLocalTrack} track - The {@code JitsiLocalTrack} to mute or unmute.
 * @param {boolean} muted - If the specified {@code track} is to be muted, then {@code true}; otherwise, {@code false}.
 * @param {Object} state - The redux state.
 * @param {Function} dispatch - The dispatch method.
 * @returns {Promise}
 */
export function setTrackMuted(track, muted, state, dispatch) {
    muted = Boolean(muted); // eslint-disable-line no-param-reassign

    // Ignore the check for desktop track muted operation. When the screenshare is terminated by clicking on the
    // browser's 'Stop sharing' button, the local stream is stopped before the inactive stream handler is fired.
    // We still need to proceed here and remove the track from the peerconnection.
    if (track.isMuted() === muted && track.getVideoType() !== VIDEO_TYPE.DESKTOP) {
        return Promise.resolve();
    }

    const f = muted ? 'mute' : 'unmute';
    const mediaType = track.getType();

    _setGUMPendingState(IGUMPendingState.PENDING_UNMUTE, mediaType, muted, dispatch);

    return track[f]().then((result) => {
        _setGUMPendingState(IGUMPendingState.NONE, mediaType, muted, dispatch);

        return result;
    })
    .catch((error) => {
        _setGUMPendingState(IGUMPendingState.NONE, mediaType, muted, dispatch);

        // Track might be already disposed so ignore such an error.
        if (error.name !== JitsiTrackErrors.TRACK_IS_DISPOSED) {
            logger.error(`set track ${f} failed`, error);

            return Promise.reject(error);
        }
    });
}

/**
 * Logs the current track state for a participant.
 *
 * @param {ITrack[]} tracksState - The tracks from redux.
 * @param {string} participantId - The ID of the participant.
 * @param {string} reason - The reason for the track change.
 * @returns {void}
 */
export function logTracksForParticipant(tracksState, participantId, reason) {
    if (!participantId) {
        return;
    }
    const tracks = getTrackByParticipantId(tracksState, participantId);
    const logStringPrefix = `Track state for participant ${participantId} changed`;
    const trackStateStrings = tracks.map(t => `{type: ${t.mediaType}, videoType: ${t.videoType}, muted: ${
        t.muted}, isReceivingData: ${t.isReceivingData}, jitsiTrack: ${t.jitsiTrack?.toString()}}`);
    const tracksLogMsg = trackStateStrings.length > 0 ? `\n${trackStateStrings.join('\n')}` : ' No tracks available!';

    logger.debug(`${logStringPrefix}${reason ? `(reason: ${reason})` : ''}:${tracksLogMsg}`);
}

/**
 * Gets the default camera facing mode.
 *
 * @param {Object} state - The redux state.
 * @returns {string} - The camera facing mode.
 */
export function getCameraFacingMode(state) {
    return state['features/base/config'].cameraFacingMode ?? CAMERA_FACING_MODE.USER;
}
