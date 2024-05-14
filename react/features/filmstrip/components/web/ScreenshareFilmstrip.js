import React from 'react';
import { connect } from 'react-redux';

import { LAYOUTS, LAYOUT_CLASSNAMES } from '../../../video-layout/constants';
import { getCurrentLayout } from '../../../video-layout/functions.web';
import {
    FILMSTRIP_TYPE
} from '../../constants';
import { getScreenshareFilmstripParticipantId } from '../../functions.web';

import Filmstrip from './Filmstrip';

// eslint-disable-next-line no-confusing-arrow
const ScreenshareFilmstrip = (props) =>
    props._currentLayout === LAYOUTS.STAGE_FILMSTRIP_VIEW
        && props._remoteParticipants.length === 1 ? (
            <span className = { LAYOUT_CLASSNAMES[LAYOUTS.TILE_VIEW] }>
                <Filmstrip
                    { ...props }
                    filmstripType = { FILMSTRIP_TYPE.SCREENSHARE } />
            </span>
        ) : null
;

/**
 * Maps (parts of) the Redux state to the associated {@code Filmstrip}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {any} _ownProps - Components' own props.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state, _ownProps) {
    const {
        screenshareFilmstripDimensions: {
            filmstripHeight,
            filmstripWidth,
            thumbnailSize
        }
    } = state['features/filmstrip'];
    const id = getScreenshareFilmstripParticipantId(state);

    return {
        _columns: 1,
        _currentLayout: getCurrentLayout(state),
        _filmstripHeight: filmstripHeight,
        _filmstripWidth: filmstripWidth,
        _remoteParticipants: id ? [ id ] : [],
        _resizableFilmstrip: false,
        _rows: 1,
        _thumbnailWidth: thumbnailSize?.width,
        _thumbnailHeight: thumbnailSize?.height,
        _verticalViewGrid: false,
        _verticalViewBackground: false
    };
}

export default connect(_mapStateToProps)(ScreenshareFilmstrip);
