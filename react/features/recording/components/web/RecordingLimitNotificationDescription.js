import React from 'react';
import { connect } from 'react-redux';

import { translate, translateToHTML } from '../../../base/i18n/functions';

/**
 * A component that renders the description of the notification for the recording initiator.
 *
 * @param {IProps} props - The props of the component.
 * @returns {Component}
 */
function RecordingLimitNotificationDescription(props) {
    const { _limit, _appName, _appURL, isLiveStreaming, t } = props;

    return (
        <span>
            {
                translateToHTML(
                    t,
                    `${isLiveStreaming ? 'liveStreaming' : 'recording'}.limitNotificationDescriptionWeb`, {
                        limit: _limit,
                        app: _appName,
                        url: _appURL
                    })
            }
        </span>
    );
}


/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function _mapStateToProps(state) {
    const { recordingLimit = {} } = state['features/base/config'];
    const { limit: _limit, appName: _appName, appURL: _appURL } = recordingLimit;

    return {
        _limit,
        _appName,
        _appURL
    };
}

export default translate(connect(_mapStateToProps)(RecordingLimitNotificationDescription));
