// @flow

import { Theme } from '@mui/material';
import clsx from 'clsx';
import moment from 'moment';
import React from 'react';
import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';
import { DatePicker } from 'antd';

import tokenLocalStorage from '../../../../api/tokenLocalStorage';
import { createProfilePanelButtonEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { login, logout } from '../../../authentication/actions.web';
import Avatar from '../../../base/avatar/components/Avatar';
import AbstractDialogTab from '../../../base/dialog/components/web/AbstractDialogTab';
import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n/functions';
import { getLocalParticipant } from '../../../base/participants/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';

import Button from '../../../base/ui/components/web/Button';
import Input from '../../../base/ui/components/web/Input';

import ko from '../../../../components/DatePicker/locale/ko_KR';
import filterXSS from '../../../../utils/filterXSS';

import { DEFAULT_BIRTHDATE } from '../../../base/participants/constants';

const DATE_FORMAT = "YYYY-MM-DD";
const locales = {
    ko,
};

const styles = (theme: Theme) => {
    return {
        container: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            padding: '0 2px'
        },

        avatarContainer: {
            display: 'flex',
            width: '100%',
            justifyContent: 'center',
            marginBottom: theme.spacing(4)
        },

        birthdayEdit: {
            display: 'flex',
            width: '100%',
            marginBottom: theme.spacing(4)
        },

        birthdayEditField: {
            display: 'flex',
            flexDirection: 'column',
            flex: 1
        },

        bottomMargin: {
            marginBottom: theme.spacing(4)
        },

        label: {
            color: `${theme.palette.text01} !important`,
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            marginBottom: theme.spacing(2),

            '&.is-mobile': {
                ...withPixelLineHeight(theme.typography.bodyShortRegularLarge)
            }
        },

        name: {
            marginBottom: theme.spacing(1)
        }
    };
};

/**
 * React {@code Component} for modifying the local user's profile.
 *
 * @augments Component
 */
class ProfileTab extends AbstractDialogTab {
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
    constructor(props) {
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

    /**
     * Changes display name of the user.
     *
     * @param {string} value - The key event to handle.
     *
     * @returns {void}
     */
    _onDisplayNameChange(value) {
        super._onChange({ displayName: filterXSS(value) });
    }

    /**
     * Changes email of the user.
     *
     * @param {string} value - The key event to handle.
     *
     * @returns {void}
     */
    _onEmailChange(value) {
        super._onChange({ email: filterXSS(value) });
    }

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
            authLogin,
            displayName,
            email,
            hideEmailInSettings,
            id,
            readOnlyName,
            t
        } = this.props;
        const classes = withStyles.getClasses(this.props);
        const isMobile = isMobileBrowser();
        const showFootNote = authLogin
            && this.state.birthdate === DEFAULT_BIRTHDATE;

        return (
            <div className = { classes.container } >
                <div className = { classes.avatarContainer }>
                    <Avatar
                        participantId = { id }
                        size = { 60 } />
                </div>
                <Input
                    className = { classes.bottomMargin }
                    disabled = { readOnlyName }
                    id = 'setDisplayName'
                    label = { t('profile.setDisplayNameLabel') }
                    name = 'name'
                    onChange = { this._onDisplayNameChange }
                    placeholder = { t('settings.name') }
                    type = 'text'
                    value = { displayName } />
                {!hideEmailInSettings && <div className = 'profile-edit-field'>
                    <Input
                        className = { classes.bottomMargin }
                        id = 'setEmail'
                        label = { t('profile.setEmailLabel') }
                        name = 'email'
                        onChange = { this._onEmailChange }
                        placeholder = { t('profile.setEmailInput') }
                        type = 'text'
                        value = { email } />
                </div>}

                {/* display the date picker field and corresponding footnote only if the user has logged in */}
                { authLogin && <div className = { classes.birthdayEdit }>
                    <div className = { classes.birthdayEditField }>
                        <label className = { clsx(classes.label, isMobile && 'is-mobile') }>
                            {t('profile.birthday')}
                        </label>
                        <DatePicker
                            format = { DATE_FORMAT }
                            defaultValue = { this.state.birthdate ? this.state.birthdate : null }
                            id = 'birthdatepicker'
                            locale = { this.state.locale }
                            onChange = { this._onBirthDateChange }
                        />
                    </div>
                </div> }
                { showFootNote && this._renderFootNote() }
                { authEnabled && this._renderAuth() }
            </div>
        );
    }

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

            this.props.dispatch(logout());
        } else {
            sendAnalytics(createProfilePanelButtonEvent('login.button'));

            this.props.dispatch(login());
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
            displayName,
            t,
            useLogin
        } = this.props;

        const classes = withStyles.getClasses(this.props);

        return (
            <div>
                <h2 className = { classes.label }>
                    { t('toolbar.authenticate') }
                </h2>
                { authLogin
                    && <div className = { classes.name }>
                        { t('settings.loggedIn', { name: displayName }) }
                    </div> }
                { !authLogin && useLogin && (
                    <Button
                        accessibilityLabel = { authLogin ? t('toolbar.logout') : t('toolbar.login') }
                        id = 'login_button'
                        label = { authLogin ? t('toolbar.logout') : t('toolbar.login') }
                        onClick = { this._onAuthToggle } />
                ) }
            </div>
        );
    }
}

export default withStyles(translate(connect()(ProfileTab)), styles);
