import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { translate } from '../../base/i18n/functions';

/**
 * A React Component showing a button to sign in with Google.
 *
 * @augments Component
 */
class GoogleSignInButton extends Component {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <div
                className = 'google-sign-in'
                onClick = { this.props.onClick }>
                <img
                    alt = { t('welcomepage.logo.googleLogo') }
                    className = 'google-logo'
                    src = 'images/googleLogo.svg' />
                <div className = 'google-cta'>
                    {
                        t(this.props.signedIn
                            ? 'liveStreaming.signOut'
                            : 'liveStreaming.signIn')
                    }
                </div>
            </div>
        );
    }
}

export default translate(GoogleSignInButton);
