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

import AbstractPinParticipantsDialog from '../../AbstractPinParticipantsDialog';

import PinnedPane from './PinnedPane';
import ParticipantsPane from './ParticipantsPane';

const styles = theme => {
    return {
        container: {
            display: 'flex',
            flexDirection: 'row',
        },
    };
};

/**
 * Dialog to edit pinned tiles.
 */
class PinParticipantsDialog extends AbstractPinParticipantsDialog {
    constructor(props) {
        super(props);

        this.state = {
            pinned: props._pinnedTiles,
        };

        this._isPinned = this._isPinned.bind(this);
        this._onMoveItem = this._onMoveItem.bind(this);
        this._onReset = this._onReset.bind(this);
        this._onPinParticipant = this._onPinParticipant.bind(this);
        this._onSubmitForm = this._onSubmitForm.bind(this);
    }

    _isPinned: (id: string) => boolean;

    _isPinned(id) {
        return this.state.pinned.indexOf(id) !== -1;
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
        if (!isEqual(this.state.pinned, this.props._pinnedTiles)) {
            this._onSubmit(this.state.pinned);
        }

        return true;
    }

    _onPinParticipant: (id: string) => Function;

    _onPinParticipant(id) {
        const { _rows } = this.props;

        return e => {
            if (e.target.checked) {
                if (this.state.pinned.length === (_rows * _rows)) {
                    console.error('Participants can pin up to', _rows * _rows);
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
        const { pinned } = this.state;

        return (
            <Dialog
                okKey = 'dialog.apply'
                onSubmit = { this._onSubmitForm }
                titleKey = 'toolbar.pinParticipants'
                width = 'large'>
                <div className = { classes.container }>
                    <PinnedPane
                        items = { pinned }
                        moveItem = { this._onMoveItem }
                        onRemove = { this._onPinParticipant } />
                    <ParticipantsPane
                        isPinned = { this._isPinned }
                        onChange = { this._onPinParticipant }
                        onReset = { pinned.length ? this._onReset : undefined }
                        pinnedCount = { pinned.length } />
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
        _pinnedTiles: getPinnedTiles(state),
        _rows: interfaceConfig.TILE_VIEW_MAX_COLUMNS
    };
}

export default translate(connect(mapStateToProps)(withStyles(styles)(PinParticipantsDialog)));
