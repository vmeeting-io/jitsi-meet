// @flow

import { once } from 'lodash';
import React from 'react';

import { getAuthUrl } from '../../../../api/url';
import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { appNavigate } from '../../../app/actions';
import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import {
    getLocalParticipant,
    PARTICIPANT_ROLE
 } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractHangupButton } from '../../../base/toolbox/components';
import type { AbstractButtonProps } from '../../../base/toolbox/components';

import HangupMenu from './HangupMenu';

/**
 * The type of the React {@code Component} props of {@link HangupButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * Component that renders a toolbar button for leaving the current conference.
 *
 * @extends AbstractHangupButton
 */
class HangupButton extends AbstractHangupButton<Props, *> {
    _hangup: Function;

    accessibilityLabel = 'toolbar.accessibilityLabel.hangup';
    label = 'toolbar.hangup';
    tooltip = 'toolbar.hangup';

    /**
     * Initializes a new HangupButton instance.
     *
     * @param {Props} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._hangup = once(() => {
            sendAnalytics(createToolbarEvent('hangup'));
            this.props.dispatch(appNavigate(undefined));
        });
    }
    
    /**
     * Helper function to perform the actual hangup action.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _doHangup() {
        if (this.props._showHangupMenu) {
            this.props.dispatch(openDialog(HangupMenu));
        } else {
            this._hangup();
        }
    }
}

/**
 * Maps (parts of) the redux state to {@link HangupButton}'s React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {{}}
 */
 function _mapStateToProps(state) {
    const { remoteParticipants } = state['features/filmstrip'];
    const isModerator = getLocalParticipant(state).role === PARTICIPANT_ROLE.MODERATOR;

    return {
        _participants: remoteParticipants,
        _showHangupMenu: isModerator && remoteParticipants.length > 0,
    };
}

export default translate(connect(_mapStateToProps)(HangupButton));
