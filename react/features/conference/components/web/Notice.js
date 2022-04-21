/* @flow */

import React, { Component } from 'react';

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';

declare var config: Object;

type Props = {
    _message?: string,
};

/**
 * Notice react component.
 *
 * @class Notice
 */
class Notice extends Component<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (!this.props._message) {
            return null;
        }

        return (
            <div className = 'notice'>
                <span className = 'notice__message' >
                    { this.props._message }
                </span>
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code Notice}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _message: string,
 * }}
 */
function _mapStateToProps(state) {
    let noticeMessage = state['features/base/conference'].noticeMessage;
    noticeMessage = typeof noticeMessage !== 'undefined'
        ? noticeMessage
        : state['features/base/config'].noticeMessage;

    return {
        _message: noticeMessage ? decodeURIComponent(noticeMessage) : ''
    };
}
export default translate(connect(_mapStateToProps)(Notice));
