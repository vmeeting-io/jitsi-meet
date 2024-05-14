import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { setPassword as setPass } from '../../../../base/conference/actions';
import { getSecurityUiConfig } from '../../../../base/config/functions.any';
import { isLocalParticipantModerator } from '../../../../base/participants/functions';
import Dialog from '../../../../base/ui/components/web/Dialog';
import E2EESection from '../../../../e2ee/components/E2EESection';
import LobbySection from '../../../../lobby/components/web/LobbySection';
import { isEnablingLobbyAllowed } from '../../../../lobby/functions';

import PasswordSection from './PasswordSection';

/**
 * Component that renders the security options dialog.
 *
 * @returns {React$Element<any>}
 */
function SecurityDialog({
    _canEditPassword,
    _conference,
    _disableLobbyPassword,
    _isEnablingLobbyAllowed,
    _locked,
    _password,
    _passwordNumberOfDigits,
    _showE2ee,
    setPassword
}) {
    const [ passwordEditEnabled, setPasswordEditEnabled ] = useState(false);

    useEffect(() => {
        if (passwordEditEnabled && _password) {
            setPasswordEditEnabled(false);
        }
    }, [ _password ]);

    return (
        <Dialog
            cancel = {{ hidden: true }}
            ok = {{ hidden: true }}
            titleKey = 'security.title'>
            <div className = 'security-dialog'>
                {
                    _isEnablingLobbyAllowed && <LobbySection />
                }
                {
                    !_disableLobbyPassword && (
                        <>
                            { _isEnablingLobbyAllowed && <div className = 'separator-line' /> }
                            <PasswordSection
                                canEditPassword = { _canEditPassword }
                                conference = { _conference }
                                locked = { _locked }
                                password = { _password }
                                passwordEditEnabled = { passwordEditEnabled }
                                passwordNumberOfDigits = { _passwordNumberOfDigits }
                                setPassword = { setPassword }
                                setPasswordEditEnabled = { setPasswordEditEnabled } />
                        </>
                    )
                }
                {
                    _showE2ee ? <>
                        { (_isEnablingLobbyAllowed || !_disableLobbyPassword) && <div className = 'separator-line' /> }
                        <E2EESection />
                    </> : null
                }

            </div>
        </Dialog>
    );
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code SecurityDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function mapStateToProps(state) {
    const {
        conference,
        e2eeSupported,
        locked,
        password
    } = state['features/base/conference'];
    const { roomPasswordNumberOfDigits } = state['features/base/config'];
    const { disableLobbyPassword } = getSecurityUiConfig(state);
    const _isEnablingLobbyAllowed = isEnablingLobbyAllowed(state);

    const showE2ee = Boolean(e2eeSupported) && isLocalParticipantModerator(state);

    return {
        _canEditPassword: isLocalParticipantModerator(state),
        _conference: conference,
        _dialIn: state['features/invite'],
        _disableLobbyPassword: disableLobbyPassword,
        _isEnablingLobbyAllowed,
        _locked: locked,
        _password: password,
        _passwordNumberOfDigits: roomPasswordNumberOfDigits,
        _showE2ee: showE2ee
    };
}

const mapDispatchToProps = { setPassword: setPass };

export default connect(mapStateToProps, mapDispatchToProps)(SecurityDialog);
