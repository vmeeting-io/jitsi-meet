// @flow

import { once } from 'lodash';
import React, { PureComponent } from 'react';
import { Divider } from 'react-native-paper';
import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { appNavigate } from '../../../app/actions';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { BottomSheet, hideDialog, isDialogOpen } from '../../../base/dialog';
import { grantModerator } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import HangupAllButton from './HangupAllButton';
import HangupMeButton from './HangupMeButton';
import ParticipantItem from './ParticipantItem';
import SelectModeratorAndLeave from './SelectModeratorAndLeave';
import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link HangupMenu}.
 */
type Props = {

    /**
     * The color-schemed stylesheet of the dialog feature.
     */
    _bottomSheetStyles: StyleType,

    /**
     * True if the overflow menu is currently visible, false otherwise.
     */
    _isOpen: boolean,

    /**
     * Whether the recoding button should be enabled or not.
     */
    _recordingEnabled: boolean,

    /**
     * The width of the screen.
     */
    _width: number,

    /**
     * Used for hiding the dialog when the selection was completed.
     */
    dispatch: Function
};

type State = {

    /**
     * True if show select moderator is enabled.
     */
    showSelectModerator: boolean,

    /**
     * Selected participant id.
     */
    selected: String,
}

/**
 * The exported React {@code Component}. We need it to execute
 * {@link hideDialog}.
 *
 * XXX It does not break our coding style rule to not utilize globals for state,
 * because it is merely another name for {@code export}'s {@code default}.
 */
let HangupMenu_; // eslint-disable-line prefer-const

/**
 * Implements a React {@code Component} with some extra actions in addition to
 * those in the toolbar.
 */
class HangupMenu extends PureComponent<Props, State> {
    /**
     * Initializes a new {@code HangupMenu} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            showSelectModerator: false,
        };

        this._hangup = once(() => {
            sendAnalytics(createToolbarEvent('hangup'));

            // FIXME: these should be unified.
            if (navigator.product === 'ReactNative') {
                this.props.dispatch(appNavigate(undefined));
            } else {
                this.props.dispatch(disconnect(true));
            }
        });

        // Bind event handlers so they are only bound once per instance.
        this._onCancel = this._onCancel.bind(this);
        this._onHangupMe = this._onHangupMe.bind(this);
        this._onModeratorSelection = this._onModeratorSelection.bind(this);
        this._onSubmitModeratorSelection = this._onSubmitModeratorSelection.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _bottomSheetStyles, _participants, _selected, t } = this.props;
        const { showSelectModerator } = this.state;

        const buttonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            styles: _bottomSheetStyles.buttons
        };

        if (!showSelectModerator) {
            return (
                <BottomSheet onCancel = { this._onCancel }>
                    <HangupAllButton { ...buttonProps } />
                    <HangupMeButton
                        { ...buttonProps }
                        afterClick = { this._onHangupMe }
                    />
                </BottomSheet>
            );
        }

        const selected = this.state.selected || this.props._selected;
        return (
            <BottomSheet onCancel = { this._onCancel }>
                { _participants.map(id => {
                    const className = selected ? 'menu-item-selected' : 'menu-item';

                    return (
                        <ParticipantItem
                            className = { className }
                            selected = { id === selected }
                            styles = { buttonProps.styles }
                            onClick = { () => this._onModeratorSelection(id) }
                            participantID = { id }
                            key = { id } />
                    );
                }) }
                <Divider style = { styles.divider } />
                <SelectModeratorAndLeave
                    key = 'close'
                    { ...buttonProps }
                    afterClick = { this._onSubmitModeratorSelection } />
            </BottomSheet>
        );
    }

    _onCancel: () => boolean;

    /**
     * Hides this {@code HangupMenu}.
     *
     * @private
     * @returns {boolean}
     */
    _onCancel() {
        if (this.props._isOpen) {
            this.props.dispatch(hideDialog(HangupMenu_));

            return true;
        }

        return false;
    }

    _onHangupMe: () => Boolean;

    /**
     * Handler for hangup me button
     */
    _onHangupMe() {
        const { _participants, _moderators } = this.props;
        // console.log('_onHangupMe:', _moderators);
        if (_participants.length === 1 || _moderators > 0) {
            if (_moderators === 0) {
                this.props.dispatch(grantModerator(_participants[0]));
            }
            this._hangup();
        } else {
            this.setState({ showSelectModerator: true });
        }
    }

    _onModeratorSelection: () => void;

    _onModeratorSelection(id) {
        this.setState({ selected: id });
    }

    _onSubmitModeratorSelection: () => Boolean;

    /**
     * Handler for select moderator and leave button
     */
    _onSubmitModeratorSelection() {
        const selected = this.state.selected || this.props._selected;
        this.props.dispatch(grantModerator(selected));
        this._hangup();
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { remoteParticipants } = state['features/filmstrip'];

    return {
        _bottomSheetStyles: ColorSchemeRegistry.get(state, 'BottomSheet'),
        _isOpen: isDialogOpen(state, HangupMenu_),
        _moderators: state['features/base/participants'].moderators.size,
        _participants: remoteParticipants,
        _selected: remoteParticipants[0],
    };
}

HangupMenu_ = connect(_mapStateToProps)(HangupMenu);

export default HangupMenu_;
