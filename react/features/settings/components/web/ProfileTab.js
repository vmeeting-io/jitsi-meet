// @flow

import Button from '@atlaskit/button/standard-button';
import { Label } from '@atlaskit/field-base';
import { FieldTextStateless } from '@atlaskit/field-text';
import moment from 'moment';
import React from 'react';

import UIEvents from '../../../../../service/UI/UIEvents';
import {
    sendAnalytics,
    createProfilePanelButtonEvent
} from '../../../analytics';
import { AbstractDialogTab } from '../../../base/dialog';
import type { Props as AbstractDialogTabProps } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { openLogoutDialog } from '../../actions';
import { getLocalParticipant} from '../../../base/participants';
import tokenLocalStorage from '../../../../api/tokenLocalStorage';
import DatePicker from '../../../../components/DatePicker';
import ko from '../../../../components/DatePicker/locale/ko_KR';

import { DEFAULT_BIRTHDATE } from '../../../base/participants/constants';

declare var APP: Object;
declare var config: Object;

const DATE_FORMAT = "YYYY-MM-DD";
const locales = {
    ko,
};

/**
 * The type of the React {@code Component} props of {@link ProfileTab}.
 */
export type Props = {
    ...$Exact<AbstractDialogTabProps>,

    /**
     * Whether or not server-side authentication is available.
     */
    authEnabled: boolean,

    /**
     * The name of the currently (server-side) authenticated user.
     */
    authLogin: string,

    /**
     * The display name to display for the local participant.
     */
    displayName: string,

    /**
     * The email to display for the local participant.
     */
    email: string,

    /**
     * The birthdate of the local participant;
     */
    birthDate: string,

    /**
     * If the display name is read only.
     */
    readOnlyName: boolean,

    /**
     * Whether to hide the email input in the profile settings.
     */
    hideEmailInSettings?: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * React {@code Component} for modifying the local user's profile.
 *
 * @augments Component
 */
class ProfileTab extends AbstractDialogTab<Props> {
    static defaultProps = {
        displayName: '',
        email: '',
        birthDate: DEFAULT_BIRTHDATE
    };

    /**
     * Initializes a new {@code ConnectedSettingsDialog} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code ConnectedSettingsDialog} instance with.
     */
    constructor(props: Props) {
        super(props);
        this.state = {
            birthdate: moment(props.birthDate, DATE_FORMAT), //should get the birthdate from JWT token
            locale: locales[props.currentLanguage] || undefined,
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onAuthToggle = this._onAuthToggle.bind(this);
        this._onDisplayNameChange = this._onDisplayNameChange.bind(this);
        this._onEmailChange = this._onEmailChange.bind(this);
        this._onBirthDateChange = this._onBirthDateChange.bind(this);
    }

    _onDisplayNameChange: (Object) => void;

    /**
     * Changes display name of the user.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onDisplayNameChange({ target: { value } }) {
        super._onChange({ displayName: value });
    }

    _onEmailChange: (Object) => void;

    /**
     * Changes email of the user.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onEmailChange({ target: { value } }) {
        super._onChange({ email: value });
    }

    _onBirthDateChange: (Object) => void;

    _onBirthDateChange(newBirthDate, newBirthString) {
        this.setState({ birthdate: newBirthDate });
        super._onChange({ birthdate: newBirthString });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            authEnabled,
            displayName,
            email,
            hideEmailInSettings,
            readOnlyName,
            t
        } = this.props;

        let showFootNote = false;
        let userLoggedIn = tokenLocalStorage.getItem(APP.store.getState());

        if(this.state.birthdate === DEFAULT_BIRTHDATE) {
            showFootNote = true;
        }

        return (
            <div>
                <div className = 'profile-edit'>
                    <div className = 'profile-edit-field'>
                        <FieldTextStateless
                            autoComplete = 'name'
                            compact = { true }
                            id = 'setDisplayName'
                            isReadOnly = { readOnlyName }
                            label = { t('profile.setDisplayNameLabel') }
                            onChange = { this._onDisplayNameChange }
                            placeholder = { t('settings.name') }
                            shouldFitContainer = { true }
                            type = 'text'
                            value = { displayName } />
                    </div>
                    {!hideEmailInSettings && <div className = 'profile-edit-field'>
                        <FieldTextStateless
                            compact = { true }
                            id = 'setEmail'
                            label = { t('profile.setEmailLabel') }
                            onChange = { this._onEmailChange }
                            placeholder = { t('profile.setEmailInput') }
                            shouldFitContainer = { true }
                            type = 'text'
                            value = { email } />
                    </div>}
                </div>

                {/* display the date picker field and corresponding footnote only if the user has logged in */}
                { userLoggedIn && <div className = 'birthday-edit'>
                    <div className = 'birthday-edit-field'>
                        <Label label = "Birthday" />
                        <DatePicker
                            format = { DATE_FORMAT }
                            defaultValue = { this.state.birthdate }
                            id = 'birthdatepicker'
                            locale = { this.state.locale }
                            onChange = { this._onBirthDateChange }
                        />
                    </div>
                </div> }
                { userLoggedIn && showFootNote && this._renderFootNote() }
                { authEnabled && this._renderAuth() }
            </div>
        );
    }

    _onAuthToggle: () => void;

    /**
     * Shows the dialog for logging in or out of a server and closes this
     * dialog.
     *
     * @private
     * @returns {void}
     */
    _onAuthToggle() {
        if (this.props.authLogin) {
            sendAnalytics(createProfilePanelButtonEvent('logout.button'));

            APP.store.dispatch(openLogoutDialog(
                () => APP.UI.emitEvent(UIEvents.LOGOUT)
            ));
        } else {
            sendAnalytics(createProfilePanelButtonEvent('login.button'));

            APP.UI.emitEvent(UIEvents.AUTH_CLICKED);
        }
    }

    _renderFootNote() {
        const { t } = this.props;
        return(
            <span className='birthday-footnote'>
                { t('profile.birthDayFootNote') } 
            </span>
        );
    }

    /**
     * Returns a React Element for interacting with server-side authentication.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderAuth() {
        const {
            authLogin,
            t
        } = this.props;

        const loggedIn = tokenLocalStorage.getItem(APP.store.getState());
        const localParticipant = getLocalParticipant(APP.store.getState());
        const loggedInName = localParticipant.name;
        return (
            <div>
                <h2 className = 'mock-atlaskit-label'>
                    { t('toolbar.authenticate') }
                </h2>
                { loggedIn
                    && <div className = 'auth-name'>
                        { t('settings.loggedIn', { name: loggedInName }) }
                    </div> }
                { !loggedIn && <Button
                    appearance = 'primary'
                    id = 'login_button'
                    onClick = { this._onAuthToggle }
                    type = 'button'>
                    { t('toolbar.login') }
                </Button>}
            </div>
        );
    }
}

export default translate(ProfileTab);
