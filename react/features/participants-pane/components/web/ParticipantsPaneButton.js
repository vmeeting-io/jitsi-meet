import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconUsers } from '../../../base/icons/svg';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import {
    close as closeParticipantsPane,
    open as openParticipantsPane
} from '../../../participants-pane/actions.web';
import { isParticipantsPaneEnabled } from '../../functions';

import ParticipantsCounter from './ParticipantsCounter';


/**
 * Implementation of a button for accessing participants pane.
 */
class ParticipantsPaneButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.participants';
    toggledAccessibilityLabel = 'toolbar.accessibilityLabel.closeParticipantsPane';
    icon = IconUsers;
    label = 'toolbar.participants';
    tooltip = 'toolbar.participants';
    toggledTooltip = 'toolbar.closeParticipantsPane';

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isOpen;
    }

    /**
    * Handles clicking the button, and toggles the participants pane.
    *
    * @private
    * @returns {void}
    */
    _handleClick() {
        const { dispatch, _isOpen } = this.props;

        if (_isOpen) {
            dispatch(closeParticipantsPane());
        } else {
            dispatch(openParticipantsPane());
        }
    }

    /**
     * Overrides AbstractButton's {@link Component#render()}.
     *
     * @override
     * @protected
     * @returns {React$Node}
     */
    render() {
        const { _isParticipantsPaneEnabled } = this.props;

        if (!_isParticipantsPaneEnabled) {
            return null;
        }

        return (
            <div
                className = 'toolbar-button-with-badge'>
                { super.render() }
                <ParticipantsCounter />
            </div>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function mapStateToProps(state) {
    const { isOpen } = state['features/participants-pane'];

    return {
        _isOpen: isOpen,
        _isParticipantsPaneEnabled: isParticipantsPaneEnabled(state)
    };
}

export default translate(connect(mapStateToProps)(ParticipantsPaneButton));
