/* global interfaceConfig */
// @flow

import { withStyles } from '@material-ui/core/styles';
import arrayMove from 'array-move';
import { isEqual } from 'lodash';
import React from 'react';

import { Dialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { getPinnedTiles } from '../../../../base/participants';
import { connect } from '../../../../base/redux';

import AbstractTileViewSettingsDialog from '../../AbstractTileViewSettingsDialog';

import PinnedPane from './PinnedPane';
import ParticipantsPane from './ParticipantsPane';
import TileViewMaxColumnsSettings from './TileViewMaxColumnsSettings';
import { getAuthUrl } from '../../../../../api/url';
import { getTileViewMaxColumns } from '../../..';

const styles = theme => {
    return {
        container: {
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
            pinned: props._pinnedTiles,
            tileViewMaxColumns: props._tileViewMaxColumns,
        };

        this._isPinned = this._isPinned.bind(this);
        this._onChangeTileViewMaxColumns = this._onChangeTileViewMaxColumns.bind(this);
        this._onMoveItem = this._onMoveItem.bind(this);
        this._onReset = this._onReset.bind(this);
        this._onPinParticipant = this._onPinParticipant.bind(this);
        this._onSubmitForm = this._onSubmitForm.bind(this);
    }

    /**
     * Implements {@code PureComponent.getDerivedStateFromProps}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: Props, state: State) {
        const { _local, _remote } = props;
        const pinned = state.pinned.filter(id => _remote.get(id) || _local?.id === id);

        if (!isEqual(state.pinned, pinned)) {
            return {
                ...state,
                pinned
            };
        }

        return null;
    }

    _isPinned: (id: string) => boolean;

    _isPinned(id) {
        return this.state.pinned.indexOf(id) !== -1;
    }

    _onChangeTileViewMaxColumns: (value: Number) => void;

    _onChangeTileViewMaxColumns(value) {
        this.setState({
            pinned: this.state.pinned.slice(0, value * value),
            tileViewMaxColumns: value
        });
    }

    _onMoveItem: () => void

    _onMoveItem({ oldIndex, newIndex }) {
        this.setState({
            pinned: arrayMove(this.state.pinned, oldIndex, newIndex)
        });
    }

    _onReset: () => boolean;

    _onReset() {
        this.setState({ pinned: [] });
        return true;
    }

    _onSubmitForm: (e: Object) => boolean;

    /**
     * 
     * onSubmit handler.
     * @param {*} event Object 
     * @returns boolean
     */
    _onSubmitForm(e: Object) {
        if (!isEqual(this.state.pinned, this.props._pinnedTiles)
            || this.state.tileViewMaxColumns !== this.props._tileViewMaxColumns) {
            this._onSubmit(this.state);
        }

        return true;
    }

    _onPinParticipant: (id: string) => Function;

    _onPinParticipant(id) {
        const { tileViewMaxColumns } = this.state;

        return e => {
            if (e.target.checked) {
                if (this.state.pinned.length === (tileViewMaxColumns * tileViewMaxColumns)) {
                    console.error('Participants can pin up to', tileViewMaxColumns * tileViewMaxColumns);
                } else {
                    this.setState({
                        pinned: [...this.state.pinned, id]
                    });
                }
            } else {
                this.setState({
                    pinned: this.state.pinned.filter(v => v !== id)
                });
            }
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { classes } = this.props;
        const { pinned, tileViewMaxColumns } = this.state;

        return (
            <Dialog
                okKey = 'dialog.apply'
                onSubmit = { this._onSubmitForm }
                titleKey = 'toolbar.tileViewSettings'
                width = 'large'>
                <div className = { classes.container }>
                    <div className = { classes.paneLeft }>
                        <PinnedPane
                            items = { pinned }
                            moveItem = { this._onMoveItem }
                            onRemove = { this._onPinParticipant }
                            tileViewMaxColumns = { tileViewMaxColumns } />
                    </div>
                    <div className = { classes.paneRight }>
                        <ParticipantsPane
                            isPinned = { this._isPinned }
                            onChange = { this._onPinParticipant }
                            onReset = { pinned.length ? this._onReset : undefined }
                            pinnedCount = { pinned.length } />
                        <TileViewMaxColumnsSettings
                            tileViewMaxColumns = { tileViewMaxColumns }
                            onChange = { this._onChangeTileViewMaxColumns } />
                    </div>
                </div>
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
