import React, { Component } from 'react';
import { connect } from 'react-redux';
import { shouldComponentUpdate } from 'react-window';

import { getLocalParticipant } from '../../../base/participants/functions';
import { getHideSelfView } from '../../../base/settings/functions.any';
import { LAYOUTS } from '../../../video-layout/constants';
import { getCurrentLayout } from '../../../video-layout/functions.web';
import { FILMSTRIP_TYPE, TILE_ASPECT_RATIO, TILE_HORIZONTAL_MARGIN } from '../../constants';
import { getActiveParticipantsIds, showGridInVerticalView } from '../../functions.web';

import Thumbnail from './Thumbnail';

/**
 * A wrapper Component for the Thumbnail that translates the react-window specific props
 * to the Thumbnail Component's props.
 */
class ThumbnailWrapper extends Component {
    shouldComponentUpdate: (p: any, s: any) => boolean;

    /**
     * Creates new ThumbnailWrapper instance.
     *
     * @param {IProps} props - The props of the component.
     */
    constructor(props) {
        super(props);

        this.shouldComponentUpdate = shouldComponentUpdate.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _disableSelfView,
            _filmstripType = FILMSTRIP_TYPE.MAIN,
            _isLocalScreenShare = false,
            _horizontalOffset = 0,
            _participantID,
            _thumbnailWidth,
            style
        } = this.props;

        if (typeof _participantID !== 'string') {
            return null;
        }

        if (_participantID === 'local') {
            return _disableSelfView ? null : (
                <Thumbnail
                    filmstripType = { _filmstripType }
                    horizontalOffset = { _horizontalOffset }
                    key = 'local'
                    style = { style }
                    width = { _thumbnailWidth } />);
        }

        if (_isLocalScreenShare) {
            return _disableSelfView ? null : (
                <Thumbnail
                    filmstripType = { _filmstripType }
                    horizontalOffset = { _horizontalOffset }
                    key = 'localScreenShare'
                    participantID = { _participantID }
                    style = { style }
                    width = { _thumbnailWidth } />);
        }

        return (
            <Thumbnail
                filmstripType = { _filmstripType }
                horizontalOffset = { _horizontalOffset }
                key = { `remote_${_participantID}` }
                participantID = { _participantID }
                style = { style }
                width = { _thumbnailWidth } />
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code ThumbnailWrapper}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The props passed to the component.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state, ownProps) {
    const _currentLayout = getCurrentLayout(state);
    const { remoteParticipants: remote } = state['features/filmstrip'];
    const activeParticipants = getActiveParticipantsIds(state);
    const disableSelfView = getHideSelfView(state);
    const _verticalViewGrid = showGridInVerticalView(state);
    const filmstripType = ownProps.data?.filmstripType;
    const stageFilmstrip = filmstripType === FILMSTRIP_TYPE.STAGE;
    const sortedActiveParticipants = activeParticipants.sort();
    const remoteParticipants = stageFilmstrip ? sortedActiveParticipants : remote;
    const remoteParticipantsLength = remoteParticipants.length;
    const localId = getLocalParticipant(state)?.id;

    if (_currentLayout === LAYOUTS.TILE_VIEW || _verticalViewGrid || stageFilmstrip) {
        const { columnIndex, rowIndex } = ownProps;
        const { tileViewDimensions, stageFilmstripDimensions, verticalViewDimensions } = state['features/filmstrip'];
        const { gridView } = verticalViewDimensions;
        let gridDimensions = tileViewDimensions?.gridDimensions,
            thumbnailSize = tileViewDimensions?.thumbnailSize;

        if (stageFilmstrip) {
            gridDimensions = stageFilmstripDimensions.gridDimensions;
            thumbnailSize = stageFilmstripDimensions.thumbnailSize;
        } else if (_verticalViewGrid) {
            gridDimensions = gridView?.gridDimensions;
            thumbnailSize = gridView?.thumbnailSize;
        }
        const { columns = 1, rows = 1 } = gridDimensions ?? {};
        const index = (rowIndex * columns) + columnIndex;
        let horizontalOffset, thumbnailWidth;
        const { iAmRecorder, disableTileEnlargement } = state['features/base/config'];
        const { localScreenShare } = state['features/base/participants'];
        const localParticipantsLength = localScreenShare ? 2 : 1;

        let participantsLength;

        if (stageFilmstrip) {
            // We use the length of activeParticipants in stage filmstrip which includes local participants.
            participantsLength = remoteParticipantsLength;
        } else {
            // We need to include the local screenshare participant in tile view.
            participantsLength = remoteParticipantsLength

            // Add local camera and screen share to total participant count when self view is not disabled.
            + (disableSelfView ? 0 : localParticipantsLength)

            // Removes iAmRecorder from the total participants count.
            - (iAmRecorder ? 1 : 0);
        }

        if (rowIndex === rows - 1) { // center the last row
            const partialLastRowParticipantsNumber = participantsLength % columns;

            if (partialLastRowParticipantsNumber > 0) {
                const { width = 1, height = 1 } = thumbnailSize ?? {};
                const availableWidth = columns * (width + TILE_HORIZONTAL_MARGIN);
                let widthDifference = 0;
                let widthToUse = width;

                if (!disableTileEnlargement) {
                    thumbnailWidth = Math.min(
                        (availableWidth / partialLastRowParticipantsNumber) - TILE_HORIZONTAL_MARGIN,
                        height * TILE_ASPECT_RATIO);
                    widthDifference = thumbnailWidth - width;
                    widthToUse = thumbnailWidth;
                }

                horizontalOffset
                    = Math.floor((availableWidth
                        - (partialLastRowParticipantsNumber * (widthToUse + TILE_HORIZONTAL_MARGIN))) / 2
                    )
                    + (columnIndex * widthDifference);
            }
        }

        if (index > participantsLength - 1) {
            return {};
        }

        if (stageFilmstrip) {
            return {
                _disableSelfView: disableSelfView,
                _filmstripType: filmstripType,
                _participantID: remoteParticipants[index] === localId ? 'local' : remoteParticipants[index],
                _horizontalOffset: horizontalOffset,
                _thumbnailWidth: thumbnailWidth
            };
        }

        // When the thumbnails are reordered, local participant is inserted at index 0.
        const localIndex = disableSelfView ? remoteParticipantsLength : 0;

        // Local screen share is inserted at index 1 after the local camera.
        const localScreenShareIndex = disableSelfView ? remoteParticipantsLength : 1;
        const remoteIndex = !iAmRecorder && !disableSelfView
            ? index - localParticipantsLength
            : index;

        if (!iAmRecorder && index === localIndex) {
            return {
                _disableSelfView: disableSelfView,
                _filmstripType: filmstripType,
                _participantID: 'local',
                _horizontalOffset: horizontalOffset,
                _thumbnailWidth: thumbnailWidth
            };
        }

        if (!iAmRecorder && localScreenShare && index === localScreenShareIndex) {
            return {
                _disableSelfView: disableSelfView,
                _filmstripType: filmstripType,
                _isLocalScreenShare: true,
                _participantID: localScreenShare?.id,
                _horizontalOffset: horizontalOffset,
                _thumbnailWidth: thumbnailWidth
            };
        }

        return {
            _filmstripType: filmstripType,
            _participantID: remoteParticipants[remoteIndex],
            _horizontalOffset: horizontalOffset,
            _thumbnailWidth: thumbnailWidth
        };
    }

    if (_currentLayout === LAYOUTS.STAGE_FILMSTRIP_VIEW && filmstripType === FILMSTRIP_TYPE.SCREENSHARE) {
        const { screenshareFilmstripParticipantId } = state['features/filmstrip'];
        const screenshares = state['features/video-layout'].remoteScreenShares;
        let id = screenshares.find(sId => sId === screenshareFilmstripParticipantId);

        if (!id && screenshares.length) {
            id = screenshares[screenshares.length - 1];
        }

        return {
            _filmstripType: filmstripType,
            _participantID: id
        };
    }

    const { index } = ownProps;

    if (typeof index !== 'number' || remoteParticipantsLength <= index) {
        return {};
    }

    return {
        _participantID: remoteParticipants[index]
    };
}

export default connect(_mapStateToProps)(ThumbnailWrapper);
