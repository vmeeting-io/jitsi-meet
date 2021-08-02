// @flow

import { StateListenerRegistry } from '../base/redux';
import { setPagination, shouldDisplayTileView } from '../video-layout';

/**
 * Listens for changes in the selected layout to calculate the dimensions of the tile view grid and horizontal view.
 */
StateListenerRegistry.register(
    /* selector */ state => shouldDisplayTileView(state),
    /* listener */ (bool, store) => {
        store.dispatch(setPagination());
    });
