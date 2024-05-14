import React, { Component } from 'react';

import { translate } from '../../base/i18n/functions';

/**
 * A React Component showing a button to sign in with Microsoft.
 *
 * @augments Component
 */
class MicrosoftSignInButton extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div
                className = 'microsoft-sign-in'
                onClick = { this.props.onClick }>
                <img
                    alt = { this.props.t('welcomepage.logo.microsoftLogo') }
                    className = 'microsoft-logo'
                    src = 'images/microsoftLogo.svg' />
                <div className = 'microsoft-cta'>
                    { this.props.text }
                </div>
            </div>
        );
    }
}

export default translate(MicrosoftSignInButton);
