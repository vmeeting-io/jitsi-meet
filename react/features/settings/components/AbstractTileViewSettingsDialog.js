// @flow

import axios from 'axios';
import { Component } from 'react';
import { batch } from 'react-redux';
import { pinTiles } from '../../base/participants';
import { setTileViewMaxColumns } from '../actions';

// import { pinParticipants } from '../../base/participants';

type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * Function to translate i18n labels.
     */
    t: Function
};

/**
 * Abstract dialog to pin participant tiles.
 */
export default class AbstractTileViewSettingsDialog
    extends Component<Props> {
    /**
     * Initializes a new {@code AbstractTileViewSettingsDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onSubmit = this._onSubmit.bind(this);
    }

    _onSubmit: () => boolean;

    /**
     * Callback for the confirm button.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit(data) {
        batch(() => {
            this.props.dispatch(pinTiles(data.pinned));
            this.props.dispatch(setTileViewMaxColumns(data.tileViewMaxColumns));
        });

        const reqConfig = {
            headers: { Authorization: `Bearer ${window._env_.VMEETING_API_TOKEN}`}
        };
        const { _apiBase, _roomInfo } = this.props;
        axios.patch(`${_apiBase}/conferences/${_roomInfo._id}`, {
            pinned_tiles: data.pinned,
            tileview_max_columns: data.tileViewMaxColumns
        }, reqConfig);
    
        return true;
    }
}
