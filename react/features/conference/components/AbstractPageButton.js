// @flow

import { getMaxColumnCount, getMaxRowCount, shouldDisplayTileView } from '../../video-layout';

/**
 * Maps (parts of) the redux state to the associated props of the {@link AbstractPageButton}
 * {@code Component}.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _current: number,
 *     _totalPages: number
 * }}
 */
export function _abstractMapStateToProps(state: Object) {
    const { pagination } = state['features/video-layout'] || {};
    const { clientWidth, clientHeight } = state['features/base/responsive-ui'];

    return {
        _shouldDisplayTileView: shouldDisplayTileView(state),
        _totalPages: pagination?.totalPages || 1,
        _current: pagination?.current || 1,
        _clientWidth: clientWidth,
        _clientHeight: clientHeight,
        _row: getMaxRowCount(state),
        _column: getMaxColumnCount(state),
    };
}
