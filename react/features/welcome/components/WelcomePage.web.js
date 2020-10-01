/* global interfaceConfig, process */

import Button, { ButtonGroup } from '@atlaskit/button';
import DropdownMenu, { DropdownItem, DropdownItemGroup } from '@atlaskit/dropdown-menu';
import { jitsiLocalStorage } from '@jitsi/js-utils';
import axios from 'axios';
import React from 'react';

import { isMobileBrowser } from '../../base/environment/utils';
import { translate, translateToHTML } from '../../base/i18n';
import { Icon, IconWarning } from '../../base/icons';
import { setJWT } from '../../base/jwt';
import { Watermarks } from '../../base/react';
import { connect } from '../../base/redux';
import { CalendarList } from '../../calendar-sync';
import { NotificationsContainer } from '../../notifications/components';
import { RecentList } from '../../recent-list';
import { SETTINGS_TABS } from '../../settings';
import { openSettingsDialog } from '../../settings/actions';

import { AbstractWelcomePage, _mapStateToProps } from './AbstractWelcomePage';
import Tabs from './Tabs';

/**
 * The pattern used to validate room name.
 * @type {string}
 */
export const ROOM_NAME_VALIDATE_PATTERN_STR = '^[^?&:\u0022\u0027%#]+$';

const AUTH_PAGE_BASE = process.env.VMEETING_FRONT_BASE;
const AUTH_API_BASE = process.env.VMEETING_API_BASE;
const AUTH_JWT_TOKEN = process.env.JWT_APP_ID;

/**
 * Maximum number of pixels corresponding to a mobile layout.
 * @type {number}
 */
const WINDOW_WIDTH_THRESHOLD = 425;

/**
 * The Web container rendering the welcome page.
 *
 * @extends AbstractWelcomePage
 */
class WelcomePage extends AbstractWelcomePage {
    /**
     * Default values for {@code WelcomePage} component's properties.
     *
     * @static
     */
    static defaultProps = {
        _room: ''
    };

    /**
     * Initializes a new WelcomePage instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            ...this.state,

            generateRoomnames:
                interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE,
            selectedTab: 0,
            submitting: false
        };

        /**
         * The HTML Element used as the container for additional content. Used
         * for directly appending the additional content template to the dom.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalContentRef = null;

        this._roomInputRef = null;

        this._redirectRoom = false;

        /**
         * The HTML Element used as the container for additional toolbar content. Used
         * for directly appending the additional content template to the dom.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalToolbarContentRef = null;

        /**
         * The template to use as the main content for the welcome page. If
         * not found then only the welcome page head will display.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalContentTemplate = document.getElementById(
            'welcome-page-additional-content-template');

        /**
         * The template to use as the additional content for the welcome page header toolbar.
         * If not found then only the settings icon will be displayed.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalToolbarContentTemplate = document.getElementById(
            'settings-toolbar-additional-content-template'
        );

        // Bind event handlers so they are only bound once per instance.
        this._onFormSubmit = this._onFormSubmit.bind(this);
        this._onRoomChange = this._onRoomChange.bind(this);
        this._setAdditionalContentRef
            = this._setAdditionalContentRef.bind(this);
        this._setRoomInputRef = this._setRoomInputRef.bind(this);
        this._setAdditionalToolbarContentRef
            = this._setAdditionalToolbarContentRef.bind(this);
        this._onTabSelected = this._onTabSelected.bind(this);
        this._onLogout = this._onLogout.bind(this);
        this._onOpenSettings = this._onOpenSettings.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        super.componentDidMount();

        document.body.classList.add('welcome-page');
        document.title = interfaceConfig.APP_NAME;

        if (this.state.generateRoomnames) {
            this._updateRoomname();
        }

        if (this._shouldShowAdditionalContent()) {
            this._additionalContentRef.appendChild(
                this._additionalContentTemplate.content.cloneNode(true));
        }

        if (this._shouldShowAdditionalToolbarContent()) {
            this._additionalToolbarContentRef.appendChild(
                this._additionalToolbarContentTemplate.content.cloneNode(true)
            );
        }
    }

    /**
     * Removes the classname used for custom styling of the welcome page.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        super.componentWillUnmount();

        document.body.classList.remove('welcome-page');
    }

    /**
     * Logout handler.
     *
     * @inheritdoc
     * @returns {void}
     */
    _onLogout() {
        const { dispatch } = this.props;

        this.setState({ submitting: true });

        return axios.get(`${AUTH_API_BASE}/logout`).then(() => {
            // dispatch(setCurrentUser());
            jitsiLocalStorage.removeItem(AUTH_JWT_TOKEN);
            dispatch(setJWT());
            this.setState({ submitting: false });
        });
    }

    /**
     * Settings handler.
     *
     * @inheritdoc
     * @returns {void}
     */
    _onOpenSettings() {
        const { dispatch } = this.props;
        const defaultTab = SETTINGS_TABS.DEVICES;

        dispatch(openSettingsDialog(defaultTab));
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
        const { _moderatedRoomServiceUrl, _user, t } = this.props;
        const { submitting } = this.state;
        const { APP_NAME, DEFAULT_WELCOME_PAGE_LOGO_URL } = interfaceConfig;
        const showAdditionalContent = this._shouldShowAdditionalContent();
        const showAdditionalToolbarContent = this._shouldShowAdditionalToolbarContent();
        const showResponsiveText = this._shouldShowResponsiveText();
        const buttons = [];

        if (_user) {
            if (_user.isAdmin) {
                buttons.push(
                    <Button
                        appearance = 'primary'
                        className = 'button'
                        href = { `${AUTH_PAGE_BASE}/admin` }>
                        { t('welcomepage.adminConsole') }
                    </Button>
                );
            }
            buttons.push(
                <DropdownMenu
                    isLoading = { submitting }
                    trigger = {
                        <div className = 'user-container'>
                            { _user.avatarURL && (
                                <img
                                    alt = 'avatar'
                                    className = 'avatar'
                                    src = { _user.avatarURL } />
                            )}
                            { _user.name }
                        </div>
                    }
                    triggerType = 'button'>
                    <DropdownItemGroup>
                        <DropdownItem href = { `${AUTH_PAGE_BASE}/account` }>{ t('welcomepage.account') }</DropdownItem>
                        <DropdownItem onClick = { this._onLogout }>{ t('toolbar.logout') }</DropdownItem>
                    </DropdownItemGroup>
                </DropdownMenu>
            );
        } else {
            buttons.push(
                <Button
                    appearance = 'primary'
                    className = 'button'
                    href = { `${AUTH_PAGE_BASE}/register` }>
                    { t('toolbar.Register') }
                </Button>
            );
            buttons.push(
                <Button
                    appearance = 'subtle'
                    className = 'button'
                    href = { `${AUTH_PAGE_BASE}/login` }>
                    {t('toolbar.login')}
                </Button>
            );
        }

        return (
            <div
                className = { `welcome ${showAdditionalContent
                    ? 'with-content' : 'without-content'}` }
                id = 'welcome_page'>
                <div className = 'header'>
                    <div className = 'container'>
                        <div className = 'welcome-watermark'>
                            <Watermarks defaultJitsiLogoURL = { DEFAULT_WELCOME_PAGE_LOGO_URL } />
                        </div>
                        <div className = 'header-toolbars'>
                            <ButtonGroup>
                                <Button
                                    appearance = 'subtle'
                                    className = 'button'
                                    href = { `${AUTH_PAGE_BASE}/features` }>
                                    {t('toolbar.features')}
                                </Button>
                                { buttons }
                                <Button
                                    appearance = 'subtle'
                                    className = 'button'
                                    onClick = { this._onOpenSettings }>
                                    { t('toolbar.Settings') }
                                </Button>
                                { showAdditionalToolbarContent
                                    ? <div
                                        className = 'settings-toolbar-content'
                                        ref = { this._setAdditionalToolbarContentRef } />
                                    : null
                                }
                            </ButtonGroup>
                        </div>
                    </div>
                </div>
                <div className = 'welcome-content'>
                    <div className = 'bg-wrapper'>
                        <div className = 'content-wrapper'>
                            <div className = 'intro-wrapper'>
                                <div className = 'header-text'>
                                    <h1 className = 'header-text-title'>
                                        { t('welcomepage.title') }
                                    </h1>
                                    <p className = 'header-text-description'>
                                        { t('welcomepage.appDescription',
                                            { app: APP_NAME }) }
                                    </p>
                                </div>
                                <div id = 'enter_room'>
                                    <div className = 'enter-room-input-container'>
                                        <form onSubmit = { this._onFormSubmit }>
                                            <input
                                                autoFocus = { true }
                                                className = 'enter-room-input'
                                                id = 'enter_room_field'
                                                onChange = { this._onRoomChange }
                                                pattern = { ROOM_NAME_VALIDATE_PATTERN_STR }
                                                placeholder = { this.state.roomPlaceholder }
                                                ref = { this._setRoomInputRef }
                                                title = { t('welcomepage.roomNameAllowedChars') }
                                                type = 'text'
                                                value = { this.state.room } />
                                            { this._renderInsecureRoomNameWarning() }
                                        </form>
                                    </div>
                                    <div
                                        className = 'welcome-page-button'
                                        id = 'enter_room_button'
                                        onClick = { this._onFormSubmit }>
                                        {
                                            showResponsiveText
                                                ? t('welcomepage.goSmall')
                                                : t('welcomepage.go')
                                        }
                                    </div>
                                    { _moderatedRoomServiceUrl && (
                                        <div id = 'moderated-meetings'>
                                            <p>
                                                {
                                                    translateToHTML(
                                                        t, 'welcomepage.moderatedMessage',
                                                        { url: _moderatedRoomServiceUrl })
                                                }
                                            </p>
                                        </div>
                                    ) }
                                </div>
                            </div>
                        </div>
                        { this._renderTabs() }
                        { showAdditionalContent
                            ? <div
                                className = 'welcome-page-content'
                                ref = { this._setAdditionalContentRef } />
                            : null }
                        <NotificationsContainer />
                    </div>
                    <div className = 'footer'>
                        <div className = 'container'>
                            <div className = 'copyright'>
                                {t('footer.copyright')}
                            </div>
                            <div className = 'nav'>
                                <a href = { `${AUTH_PAGE_BASE}/tos` }>{t('footer.tos')}</a>
                                <a href = { `${AUTH_PAGE_BASE}/privacy` }>{t('footer.privacy')}</a>
                                <a
                                    alt = { t('footer.contactUs') }
                                    href = { interfaceConfig.SUPPORT_URL }>
                                    {t('footer.contactUs')}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Renders the insecure room name warning.
     *
     * @inheritdoc
     */
    _doRenderInsecureRoomNameWarning() {
        return (
            <div className = 'insecure-room-name-warning'>
                <Icon src = { IconWarning } />
                <span>
                    { this.props.t('security.insecureRoomNameWarning') }
                </span>
            </div>
        );
    }

    /**
     * Prevents submission of the form and delegates join logic.
     *
     * @param {Event} event - The HTML Event which details the form submission.
     * @private
     * @returns {void}
     */
    _onFormSubmit(event) {
        event.preventDefault();

        if (!this._roomInputRef || this._roomInputRef.reportValidity()) {
            this._onJoin();
        }
    }

    /**
     * Overrides the super to account for the differences in the argument types
     * provided by HTML and React Native text inputs.
     *
     * @inheritdoc
     * @override
     * @param {Event} event - The (HTML) Event which details the change such as
     * the EventTarget.
     * @protected
     */
    _onRoomChange(event) {
        super._onRoomChange(event.target.value);
    }

    /**
     * Callback invoked when the desired tab to display should be changed.
     *
     * @param {number} tabIndex - The index of the tab within the array of
     * displayed tabs.
     * @private
     * @returns {void}
     */
    _onTabSelected(tabIndex) {
        this.setState({ selectedTab: tabIndex });
    }

    /**
     * Renders tabs to show previous meetings and upcoming calendar events. The
     * tabs are purposefully hidden on mobile browsers.
     *
     * @returns {ReactElement|null}
     */
    _renderTabs() {
        if (isMobileBrowser()) {
            return null;
        }

        const { _calendarEnabled, _recentListEnabled, t } = this.props;

        const tabs = [];

        if (_calendarEnabled) {
            tabs.push({
                label: t('welcomepage.calendar'),
                content: <CalendarList />
            });
        }

        if (_recentListEnabled) {
            tabs.push({
                label: t('welcomepage.recentList'),
                content: <RecentList />
            });
        }

        if (tabs.length === 0) {
            return null;
        }

        return (
            <Tabs
                onSelect = { this._onTabSelected }
                selected = { this.state.selectedTab }
                tabs = { tabs } />);
    }

    /**
     * Sets the internal reference to the HTMLDivElement used to hold the
     * welcome page content.
     *
     * @param {HTMLDivElement} el - The HTMLElement for the div that is the root
     * of the welcome page content.
     * @private
     * @returns {void}
     */
    _setAdditionalContentRef(el) {
        this._additionalContentRef = el;
    }

    /**
     * Sets the internal reference to the HTMLDivElement used to hold the
     * toolbar additional content.
     *
     * @param {HTMLDivElement} el - The HTMLElement for the div that is the root
     * of the additional toolbar content.
     * @private
     * @returns {void}
     */
    _setAdditionalToolbarContentRef(el) {
        this._additionalToolbarContentRef = el;
    }

    /**
     * Sets the internal reference to the HTMLInputElement used to hold the
     * welcome page input room element.
     *
     * @param {HTMLInputElement} el - The HTMLElement for the input of the room name on the welcome page.
     * @private
     * @returns {void}
     */
    _setRoomInputRef(el) {
        this._roomInputRef = el;
    }

    /**
     * Returns whether or not additional content should be displayed below
     * the welcome page's header for entering a room name.
     *
     * @private
     * @returns {boolean}
     */
    _shouldShowAdditionalContent() {
        return interfaceConfig.DISPLAY_WELCOME_PAGE_CONTENT
            && this._additionalContentTemplate
            && this._additionalContentTemplate.content
            && this._additionalContentTemplate.innerHTML.trim();
    }

    /**
     * Returns whether or not additional content should be displayed inside
     * the header toolbar.
     *
     * @private
     * @returns {boolean}
     */
    _shouldShowAdditionalToolbarContent() {
        return interfaceConfig.DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT
            && this._additionalToolbarContentTemplate
            && this._additionalToolbarContentTemplate.content
            && this._additionalToolbarContentTemplate.innerHTML.trim();
    }

    /**
     * Returns whether or not the screen has a size smaller than a custom margin
     * and therefore display different text in the go button.
     *
     * @private
     * @returns {boolean}
     */
    _shouldShowResponsiveText() {
        const { innerWidth } = window;

        return innerWidth <= WINDOW_WIDTH_THRESHOLD;
    }
}

export default translate(connect(_mapStateToProps)(WelcomePage));
