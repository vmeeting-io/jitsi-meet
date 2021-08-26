/* global APP, interfaceConfig, process */

import Badge from '@atlaskit/badge';
import Banner from '@atlaskit/banner';
import Button, { ButtonGroup } from '@atlaskit/button';
import DropdownMenu, { DropdownItem, DropdownItemGroup } from '@atlaskit/dropdown-menu';
import { jitsiLocalStorage } from '@jitsi/js-utils';
import axios from 'axios';
import { map, trim } from 'lodash';
import React from 'react';

import tokenLocalStorage from '../../../api/tokenLocalStorage';
import { translate, translateToHTML } from '../../base/i18n';
import { Icon, IconWarning } from '../../base/icons';
import { setJWT } from '../../base/jwt';
import { Watermarks } from '../../base/react';
import { connect } from '../../base/redux';
import { openDialog } from '../../base/dialog';
import { CalendarList } from '../../calendar-sync';
import { NotificationsContainer } from '../../notifications/components';
import { RecentList } from '../../recent-list';
import { SETTINGS_TABS } from '../../settings';
import { openSettingsDialog } from '../../settings/actions';
import { VirtualBackgroundDialog } from '../../virtual-background';

import { AbstractWelcomePage, _mapStateToProps } from './AbstractWelcomePage';
import Tabs from './Tabs';
import s from './WelcomePage.module.scss';
import { NOTIFICATION_TYPE, showSweetAlert } from '../../notifications';
import { getAvatarColor, getInitials } from '../../base/avatar';
//import alarmImg from '../../../../resources/img/appstore-badge.png';

/**
 * The pattern used to validate room name.
 * @type {string}
 */
export const ROOM_NAME_VALIDATE_PATTERN_STR = '^[^?&:\u0022\u0027%#]+$';

const AUTH_PAGE_BASE = process.env.VMEETING_FRONT_BASE;
const AUTH_API_BASE = process.env.VMEETING_API_BASE;
const DEFAULT_TENANT = process.env.DEFAULT_SITE_ID;


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
            savedNotification: jitsiLocalStorage.getItem('saved_notification'),
            submitting: false,
            currentTenant: props._jwt.tenant || DEFAULT_TENANT
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
        this._onRoomInput = this._onRoomInput.bind(this);
        this._setAdditionalContentRef
            = this._setAdditionalContentRef.bind(this);
        this._setRoomInputRef = this._setRoomInputRef.bind(this);
        this._setAdditionalToolbarContentRef
            = this._setAdditionalToolbarContentRef.bind(this);
        this._onTabSelected = this._onTabSelected.bind(this);
        this._onVirtualBackground = this._onVirtualBackground.bind(this);
        this._onLogout = this._onLogout.bind(this);
        this._onOpenSettings = this._onOpenSettings.bind(this);
        this._setEditTenant = this._setEditTenant.bind(this);
        this._handleKeyPress = this._handleKeyPress.bind(this);
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

        if (!DEFAULT_TENANT) {
            showSweetAlert({
                appearance: NOTIFICATION_TYPE.ERROR,
                descriptionKey: `dialog.invalidBuildEnvironment`,
                titleKey: 'dialog.error'
            });
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
        document.removeEventListener('keyup', this._handleKeyPress);
    }

    componentDidUpdate() {
        const { savedNotification } = this.state;
        const { t, tReady } = this.props;

        if (savedNotification && tReady) {
            this.setState({ savedNotification: null });
            jitsiLocalStorage.removeItem('saved_notification');

            try {
                const notification = JSON.parse(savedNotification);
                showSweetAlert({
                    ...notification.props,
                    customClass: { htmlContainer: s.popupMessage }
                });
            } catch (err) {
                console.error(err);
            }
        }
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
            tokenLocalStorage.removeItem(APP.store.getState());
            dispatch(setJWT());
            this.setState({ submitting: false });
        });
    }

    _onVirtualBackground(){
        const { dispatch } = this.props;
        
        dispatch(openDialog(VirtualBackgroundDialog));
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
        const { submitting, editTenant, currentTenant, inputTenant, room } = this.state;
        const { APP_NAME, DEFAULT_WELCOME_PAGE_LOGO_URL } = interfaceConfig;
        const showAdditionalContent = this._shouldShowAdditionalContent();
        const showAdditionalToolbarContent = this._shouldShowAdditionalToolbarContent();
        const buttons = [];
        const [ tenant ] = room.split('/');
        const avatarColor = getAvatarColor(getInitials(_user?.name), 0.9);

        if (_user) {
            if (_user.isAdmin) {
                buttons.push(
                    <Button
                        key = 'adminConsole'
                        appearance = 'subtle'
                        className = {`${s.button} ${s.desktop}`}
                        href = { `${AUTH_PAGE_BASE}/admin/rooms` }>
                        { t('welcomepage.adminConsole') }
                    </Button>
                );
            }
            buttons.push(
                <DropdownMenu
                    position="bottom right"
                    isLoading = { submitting }
                    key = 'userMenu'
                    trigger = {
                        <div className = {s.userContainer}>
                            { _user.avatarURL ? (
                                <img
                                    alt = 'avatar'
                                    className = {s.avatar}
                                    src = { _user.avatarURL } />
                            ) : (
                                <div className={s.avatar} style={{backgroundColor: avatarColor}}>
                                    {_user.name?.[0] || _user.username[0]}
                                </div>
                            )}
                            { _user.name }
                            { (!_user.email_verified && currentTenant === DEFAULT_TENANT) && (
                                <div className = {s.badge}>
                                    <Badge appearance="important">{1}</Badge>
                                </div>
                            )}
                        </div>
                    }
                    triggerType = 'button'>
                    <DropdownItemGroup>
                        <DropdownItem 
                            className = {`${s.menuItem} ${s.mobile}`}
                            href = { `${AUTH_PAGE_BASE}/features` }>
                            {t('toolbar.features')}
                        </DropdownItem>
                        <DropdownItem
                            className = {s.menuItem}
                            href = { `${AUTH_PAGE_BASE}/account` }>
                            { t('welcomepage.account') }
                            {(!_user.email_verified && currentTenant === DEFAULT_TENANT) && (
                                <div className = {s.badge}>
                                    <Badge appearance="important">{1}</Badge>
                                </div>
                            )}
                        </DropdownItem>
                        <DropdownItem
                            className = {s.menuItem}
                            onClick = { this._onVirtualBackground }>
                            { t('toolbar.selectBackground') }
                        </DropdownItem>
                        <DropdownItem
                            className = {s.menuItem}
                            onClick = { this._onLogout }>
                            { t('toolbar.logout') }
                        </DropdownItem>
                        <DropdownItem
                            className = {`${s.menuItem} ${s.mobile}`}
                            onClick = { this._onOpenSettings }>
                            { t('toolbar.Settings') }
                        </DropdownItem>
                    </DropdownItemGroup>
                </DropdownMenu>
            );
        } else {
            if (!config.disableUserRegistration) {
                buttons.push(
                    <Button
                        className = {`${s.primary} ${s.button}`}
                        href = { `${AUTH_PAGE_BASE}/register` }
                        key = 'register'>
                        { t('toolbar.Register') }
                    </Button>
                );
            }
            buttons.push(
                <Button
                    appearance = 'subtle'
                    className = {s.button}
                    href = { `${AUTH_PAGE_BASE}/login` }
                    key = 'login'>
                    {t('toolbar.login')}
                </Button>
            );
        }

        return (
            <div
                className = { `${s.welcome} ${showAdditionalContent
                    ? 'with-content' : 'without-content'}`
                }
                onClick = { e => this._setEditTenant(e, false) }
                id = 'welcome_page'>
                <div className = {s.header}>
                    <div className = {s.container}>
                        <Watermarks
                            className = {s.watermark}
                            defaultJitsiLogoURL = { DEFAULT_WELCOME_PAGE_LOGO_URL } />
                        <div className = {s.toolbars}>
                            <ButtonGroup>
                                <Button
                                    appearance = 'subtle'
                                    className = {`${s.button} ${s.desktop}`}
                                    href = { `${AUTH_PAGE_BASE}/features` }>
                                    {t('toolbar.features')}
                                </Button>
                                { buttons }
                                <Button
                                    appearance = 'subtle'
                                    className = {`${s.button} ${s.desktop}`}
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
                <div className = {s.welcomeContent}>
                    { config.noticeMessage && (
                        <div className = {s.banner}>
                            <Banner appearance="announcement" isOpen>
                                {config.noticeMessage}
                            </Banner>
                        </div>
                    )}
                    <div className = {s.bgWrapper}>
                        <div className = {s.contentWrapper}>
                            <div className = {s.introWrapper}>
                                <div className = {s.headerText}>
                                    <h1 className = {s.headerTextTitle}>
                                        { t('welcomepage.title') }
                                    </h1>
                                    <p className = {s.headerTextDescription}>
                                        { t('welcomepage.appDescription',
                                            { app: APP_NAME }) }
                                    </p>
                                </div>
                                <div className = {s.enterRoom}>
                                    <div className = {`${s.enterRoomInputContainer} ${editTenant ? s.editTenant : ''}`}>
                                        <div
                                            className = {s.tenant}
                                            onClick = { e => this._setEditTenant(e, true) }>
                                            <span>{ inputTenant || currentTenant }</span>
                                            <span>/</span>
                                        </div>
                                        <form onSubmit = { this._onFormSubmit }>
                                            <input
                                                autoFocus = { true }
                                                className = {s.enterRoomInput}
                                                id = 'enter_room_field'
                                                onChange = { this._onRoomChange }
                                                onClick = { e => e.stopPropagation() }
                                                onInput = { this._onRoomInput }
                                                pattern = { ROOM_NAME_VALIDATE_PATTERN_STR }
                                                placeholder = { this.state.roomPlaceholder }
                                                ref = { this._setRoomInputRef }
                                                title = { t('welcomepage.roomNameAllowedChars') }
                                                type = 'text' />
                                            { this._renderInsecureRoomNameWarning() }
                                        </form>
                                    </div>
                                    { tenant && tenant !== currentTenant ? (
                                        <div
                                            className = {`${s.welcomePageButton} ${s.disabled}`}
                                            id = 'enter_room_button'
                                            onClick = { this._onFormSubmit }>
                                            { t('welcomepage.join') }
                                        </div>
                                    ) : (
                                        <div
                                            className = {s.welcomePageButton}
                                            id = 'enter_room_button'
                                            onClick = { this._onFormSubmit }>
                                            { _user ? t('welcomepage.go') : t('welcomepage.join') }
                                        </div>
                                    )}
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
                                <div className = {s.helpMessage}>
                                    {t('welcomepage.enterRoomTitle')}
                                </div>
                            </div>
                            <div className = {s.headerImage}>
                                <img
                                    alt = 'Video conference'
                                    src = '/images/header-image.png' />
                            </div>
                        </div>
                    </div>
                    { this._renderTabs() }
                    { showAdditionalContent
                        ? <div
                            className = {s.welcomePageContent}
                            ref = { this._setAdditionalContentRef } />
                        : null }
                    <NotificationsContainer />
                    <div className = {s.footer}>
                        <div className = {s.container}>
                            <div className = {s.copyright}>
                                {t('footer.copyright', { provider: interfaceConfig.PROVIDER_NAME || '(주)케이에듀텍' })}
                            </div>
                            <div className = {s.nav}>
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
        event.stopPropagation();

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
        event.stopPropagation();
        let [ tenant, room ] = event.target.value.split('/');
        if (typeof room === 'undefined') {
            room = tenant;
            tenant = this.state.currentTenant;
        }
        super._onRoomChange(`${tenant}/${room}`);
    }

    _onRoomInput(event) {
        let [ tenant, room ] = this._roomInputRef.value.split('/');
        const { currentTenant } = this.state;

        console.log('_onRoomInput:', tenant, room);
        if (typeof room !== 'undefined') {
            this.setState({ inputTenant: tenant });
        }
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

    _setEditTenant(e, value) {
        const { currentTenant, inputTenant, generatedRoomname } = this.state;

        e.stopPropagation();

        if (value) {
            document.addEventListener('keyup', this._handleKeyPress);
        } else {
            document.removeEventListener('keyup', this._handleKeyPress);
        }
        if (value) {
            this._roomInputRef.focus();
        }
        this.setState({ editTenant: value });

        let [ tenant, room ] = map(this._roomInputRef.value.split('/'), trim);
        console.log('_setEditTenant:', value, e.type, tenant, room, generatedRoomname);
        if (typeof room === 'undefined') {
            room = tenant;
        }

        if (value) {
            this._roomInputRef.value = `${inputTenant || currentTenant}/${room || generatedRoomname}`;
            this._roomInputRef.selectionStart = 0;
            this._roomInputRef.selectionEnd = (inputTenant || currentTenant).length;
            this._clearTimeouts();
        } else {
            this._roomInputRef.value = room === generatedRoomname
                ? '' : room || '';
            if (!this._roomInputRef.value) {
                this._updateRoomname();
            }
        }
    }

    _handleKeyPress = ev => {
        if (ev.key === 'Escape') {
            this._setEditTenant(ev, false);
            this._roomInputRef.blur();
        }
    }

    /**
     * Renders tabs to show previous meetings and upcoming calendar events. The
     * tabs are purposefully hidden on mobile browsers.
     *
     * @returns {ReactElement|null}
     */
    _renderTabs() {
        // if (isMobileBrowser()) {
        //     return null;
        // }
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
}

export default translate(connect(_mapStateToProps)(WelcomePage));
