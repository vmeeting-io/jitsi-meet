// @flow

import { once } from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import { getAuthUrl } from '../../../../api/url';
import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { appNavigate } from '../../../app/actions';
import { openDialog } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import { PARTICIPANT_ROLE } from '../../../base/participants/constants';
import { getLocalParticipant } from '../../../base/participants/functions';
import AbstractHangupButton from '../../../base/toolbox/components/AbstractHangupButton';

import HangupMenu from './HangupMenu';

/**
 * Component that renders a toolbar button for leaving the current conference.
 *
 * @extends AbstractHangupButton
 */
class HangupButton extends AbstractHangupButton {
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
    constructor(props) {
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
        const { _participants } = this.props;

        if (_participants.length > 1 && this.props._showHangupMenu) {
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
    const participants = state['features/base/participants'];
    const { roomInfo } = state['features/base/conference'];
    const isModerator = getLocalParticipant(state).role === PARTICIPANT_ROLE.MODERATOR;

    return {
        _apiBase: getAuthUrl(state),
        _participants: participants,
        _showHangupMenu: isModerator && participants.length > 1,
        _roomInfo: roomInfo,
    };
}

export default translate(connect(_mapStateToProps)(HangupButton));
