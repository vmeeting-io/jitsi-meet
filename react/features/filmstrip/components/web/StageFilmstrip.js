import React from 'react';
import { connect } from 'react-redux';

import { isMobileBrowser } from '../../../base/environment/utils';
import { LAYOUTS, LAYOUT_CLASSNAMES } from '../../../video-layout/constants';
import { getCurrentLayout } from '../../../video-layout/functions.web';
import {
    ASPECT_RATIO_BREAKPOINT,
    FILMSTRIP_TYPE,
    TOOLBAR_HEIGHT_MOBILE
} from '../../constants';
import { getActiveParticipantsIds, isFilmstripResizable, isStageFilmstripTopPanel } from '../../functions.web';

import Filmstrip from './Filmstrip';

// eslint-disable-next-line no-confusing-arrow
const StageFilmstrip = (props) =>
    props._currentLayout === LAYOUTS.STAGE_FILMSTRIP_VIEW ? (
        <span className = { LAYOUT_CLASSNAMES[LAYOUTS.TILE_VIEW] }>
            <Filmstrip
                { ...props }
                filmstripType = { FILMSTRIP_TYPE.STAGE } />
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
    const { toolbarButtons } = state['features/toolbox'];
    const activeParticipants = getActiveParticipantsIds(state);
    const reduceHeight = state['features/toolbox'].visible && toolbarButtons?.length;
    const {
        gridDimensions: dimensions = { columns: undefined,
            rows: undefined },
        filmstripHeight,
        filmstripWidth,
        thumbnailSize
    } = state['features/filmstrip'].stageFilmstripDimensions;
    const gridDimensions = dimensions;

    const { clientHeight, clientWidth } = state['features/base/responsive-ui'];
    const availableSpace = clientHeight - Number(filmstripHeight);
    let filmstripPadding = 0;

    if (availableSpace > 0) {
        const paddingValue = TOOLBAR_HEIGHT_MOBILE - availableSpace;

        if (paddingValue > 0) {
            filmstripPadding = paddingValue;
        }
    } else {
        filmstripPadding = TOOLBAR_HEIGHT_MOBILE;
    }

    const collapseTileView = reduceHeight
        && isMobileBrowser()
        && clientWidth <= ASPECT_RATIO_BREAKPOINT;

    const remoteFilmstripHeight = Number(filmstripHeight) - (
        collapseTileView && filmstripPadding > 0 ? filmstripPadding : 0);
    const _topPanelFilmstrip = isStageFilmstripTopPanel(state);

    return {
        _columns: gridDimensions.columns ?? 1,
        _currentLayout: getCurrentLayout(state),
        _filmstripHeight: remoteFilmstripHeight,
        _filmstripWidth: filmstripWidth,
        _remoteParticipants: activeParticipants,
        _resizableFilmstrip: isFilmstripResizable(state) && _topPanelFilmstrip,
        _rows: gridDimensions.rows ?? 1,
        _thumbnailWidth: thumbnailSize?.width,
        _thumbnailHeight: thumbnailSize?.height,
        _topPanelFilmstrip,
        _verticalViewGrid: false,
        _verticalViewBackground: false
    };
}

export default connect(_mapStateToProps)(StageFilmstrip);
