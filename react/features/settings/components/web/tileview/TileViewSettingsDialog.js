/* global interfaceConfig */
// @flow

import { withStyles } from '@material-ui/core/styles';
import { isEqual } from 'lodash';
import React from 'react';

import { Dialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { getPinnedTiles } from '../../../../base/participants';
import { connect } from '../../../../base/redux';

import AbstractTileViewSettingsDialog from '../../AbstractTileViewSettingsDialog';

import TileViewMaxColumns from './TileViewMaxColumns';
import TileViewPinParticipants from './TileViewPinParticipants';
import { getAuthUrl } from '../../../../../api/url';
import { getTileViewMaxColumns } from '../../..';

const styles = theme => {
    return {
        layout: {
            display: 'block'
        },
        pinParticipants: {
            display: 'flex',
            flexDirection: 'row',
        },
        paneLeft: {
            flexGrow: 1
        },
        paneRight: {
            display: 'flex',
            flexDirection: 'column'
        }
    };
};

/**
 * Dialog to edit pinned tiles.
 */
class TileViewSettingsDialog extends AbstractTileViewSettingsDialog {
    constructor(props) {
        super(props);

        this.state = {
            selected: props._pinnedTiles,
            tileViewMaxColumns: props._tileViewMaxColumns,
        };

        this._onChange = this._onChange.bind(this);
        this._onSubmitForm = this._onSubmitForm.bind(this);
    }

    /**
     * Implements {@code PureComponent.getDerivedStateFromProps}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: Props, state: State) {
        const { _local, _remote } = props;
        const selected = state.selected.filter(id => _remote.get(id) || _local?.id === id);

        if (!isEqual(state.selected, selected)) {
            return {
                ...state,
                selected
            };
        }

        return null;
    }

    _onChange: (key: String, value: any) => void;

    _onChange(key, value) {
        let newState = this.state;

        switch (key) {
        case 'selected':
            newState = { ...this.state, selected: value };
            break;
        case 'tileViewMaxColumns':
            newState = {
                selected: this.state.selected.slice(0, value * value),
                tileViewMaxColumns: value
            };
            break;
        }

        this.setState(newState);
    }

    _onSubmitForm: (e: Object) => boolean;

    /**
     * 
     * onSubmit handler.
     * @param {*} event Object 
     * @returns boolean
     */
    _onSubmitForm(e: Object) {
        if (!isEqual(this.state.selected, this.props._pinnedTiles)
            || this.state.tileViewMaxColumns !== this.props._tileViewMaxColumns) {
            this._onSubmit(this.state);
        }

        return true;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                okKey = 'dialog.apply'
                onSubmit = { this._onSubmitForm }
                titleKey = 'toolbar.tileViewSettings'
                width = 'large'>
                <TileViewMaxColumns
                    onChange = { this._onChange }
                    value = { this.state.tileViewMaxColumns } />
                <TileViewPinParticipants
                    onChange = { this._onChange }
                    selected = { this.state.selected }
                    tileViewMaxColumns = { this.state.tileViewMaxColumns } />
            </Dialog>
        );
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    return {
        _apiBase: getAuthUrl(state),
        _local: state['features/base/participants'].local,
        _pinnedTiles: getPinnedTiles(state),
        _remote: state['features/base/participants'].sortedRemoteParticipants,
        _roomInfo: state['features/base/conference']?.roomInfo,
        _tileViewMaxColumns: getTileViewMaxColumns(state)
    };
}

export default translate(connect(mapStateToProps)(withStyles(styles)(TileViewSettingsDialog)));
