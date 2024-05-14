import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n/functions';
import { getDialInfoPageURL, shouldDisplayDialIn } from '../../invite/functions';

/**
 * React {@code Component} responsible for displaying a telephone number and
 * conference ID for dialing into a conference.
 *
 * @augments Component
 */
class DialInLink extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _dialIn, _dialInfoPageUrl, t } = this.props;

        if (!shouldDisplayDialIn(_dialIn)) {
            return null;
        }

        return (
            <div>{t('toolbar.noAudioSignalDialInDesc')}&nbsp;
                <a
                    href = { _dialInfoPageUrl }
                    rel = 'noopener noreferrer'
                    target = '_blank'>
                    {t('toolbar.noAudioSignalDialInLinkDesc')}
                </a>
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code DialInLink} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state) {
    return {
        _dialIn: state['features/invite'],
        _dialInfoPageUrl: getDialInfoPageURL(state)
    };
}

export default translate(connect(_mapStateToProps)(DialInLink));
