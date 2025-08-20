/* global APP, interfaceConfig, process */
import React from 'react';

import { DownOutlined } from '@ant-design/icons';
import { jitsiLocalStorage } from '@jitsi/js-utils';
import { Alert, Badge, Button, Dropdown, Menu, Space } from 'antd';
import axios from 'axios';
import { connect } from 'react-redux';

import tokenLocalStorage from '../../../api/tokenLocalStorage';
import { getAvatarColor, getInitials } from '../../base/avatar/functions';
import { translate, translateToHTML } from '../../base/i18n/functions';
import Icon from '../../base/icons/components/Icon';
import { IconWarning } from '../../base/icons/svg';
import { setJWT } from '../../base/jwt/actions';
import Watermarks from '../../base/react/components/web/Watermarks';
import CalendarList from '../../calendar-sync/components/CalendarList.web';
import { showSweetAlert } from '../../notifications/functions.web';
import { NOTIFICATION_TYPE } from '../../notifications/constants';
import NotificationsContainer from '../../notifications/components/web/NotificationsContainer';
import RecentList from '../../recent-list/components/RecentList.web';
import { SETTINGS_TABS } from '../../settings/constants';
import { openSettingsDialog } from '../../settings/actions';

import { AbstractWelcomePage, _mapStateToProps } from './AbstractWelcomePage';
import Tabs from './Tabs';
//import alarmImg from '../../../../resources/img/appstore-badge.png';

/**
 * The pattern used to validate room name.
 * alphabet, number, korean and underscore are allowed
 * @type {string}
 */
export const ROOM_NAME_VALIDATE_PATTERN_STR = 'a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣_';
// export const ROOM_NAME_VALIDATE_PATTERN_STR = '^[a-zA-Z0-9가-힣_]+$'; // this allows alphabet, numbers, underscore and completed korean
// export const ROOM_NAME_VALIDATE_PATTERN_STR = '^[a-zA-Z0-9_]+$'; // this allows alphabet, numbers and underscore only

const AUTH_PAGE_BASE = window._env_.VMEETING_FRONT_BASE;
const AUTH_API_BASE = window._env_.VMEETING_API_BASE;
const DEFAULT_TENANT = window._env_.DEFAULT_SITE_ID;

const urls = {
    account: `${AUTH_PAGE_BASE}/account`,
    admin: `${AUTH_PAGE_BASE}/admin/rooms`,
    features: `${AUTH_PAGE_BASE}/features`,
    login: `${AUTH_PAGE_BASE}/login`,
    logout: `${AUTH_PAGE_BASE}/logout`,
    meetingmanage: `${AUTH_PAGE_BASE}/meetingmanage`,
    sitemanage: `${AUTH_PAGE_BASE}/sitemanage`,
    register: `${AUTH_PAGE_BASE}/register`,
};
  
/**
 * The Web container rendering the welcome page.
 *
 * @augments AbstractWelcomePage
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
            submitting: false,
            currentTenant: props._jwt.tenant || DEFAULT_TENANT,
            userMenuVisible: false
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
        this._virtualTenantRef = null;
        this._redirectRoom = false;

        /**
         * The HTML Element used as the container for additional toolbar content. Used
         * for directly appending the additional content template to the dom.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalToolbarContentRef = null;

        this._additionalCardRef = null;

        /**
         * The template to use as the additional card displayed near the main one.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalCardTemplate = document.getElementById(
            'welcome-page-additional-card-template');

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
        this._onJoin = this._onJoin.bind(this);
        this._setAdditionalContentRef
            = this._setAdditionalContentRef.bind(this);
        this._setRoomInputRef = this._setRoomInputRef.bind(this);
        this._setVirtualTenantRef = this._setVirtualTenantRef.bind(this);
        this._setAdditionalToolbarContentRef
            = this._setAdditionalToolbarContentRef.bind(this);
        this._onTabSelected = this._onTabSelected.bind(this);
        this._onLogout = this._onLogout.bind(this);
        this._onOpenSettings = this._onOpenSettings.bind(this);
        this._handleKeyPress = this._handleKeyPress.bind(this);
        this._getManualDownloadLink = this._getManualDownloadLink.bind(this);
        this._getSiteLink = this._getSiteLink.bind(this);
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
            this._updateRoomName();
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
        super.componentDidMount();

        const { savedNotification } = this.state;
        const { tReady } = this.props;

        if (savedNotification && tReady) {
            this.setState({ savedNotification: null });
            jitsiLocalStorage.removeItem('saved_notification');

            try {
                const notification = JSON.parse(savedNotification);
                showSweetAlert({
                    ...notification.props,
                    customClass: { htmlContainer: 'popup-message' }
                });
            } catch (err) {
                console.error(err);
            }
        }
    }

    /***
     * Navigate to Vmeeting User pdf link
     *
     * @returns None
     *  */
    _getManualDownloadLink(){
        const { _features } = this.props;
        const krLink = _features.download.krLink;
        const enLink = _features.download.enLink;
        const selectedLang =  localStorage.language == "ko" ? krLink:enLink;

        var a = document.createElement('A');
        a.href = selectedLang;
        a.download = selectedLang.substr(selectedLang.lastIndexOf('/') + 1);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    /***
     * Navigate to Vmeeting User Guide site link
     *
     * @returns None
     *  */
    _getSiteLink(){
        const { _features } = this.props;
        const krLink = _features.learnMore.krLink;
        const enLink = _features.learnMore.enLink;
        const selectedLang =  localStorage.language == "ko" ? krLink:enLink;
        window.open(selectedLang);
    }

    /**
     * Logout handler.
     *
     * @inheritdoc
     * @returns {void}
     */
    async _onLogout() {
        const { dispatch } = this.props;

        this.setState({ submitting: true });

        await axios.get(`${AUTH_API_BASE}/logout`).then(() => {
            // dispatch(setCurrentUser());
            tokenLocalStorage.removeItem(APP.store.getState());
            dispatch(setJWT());
            this.setState({ submitting: false });
        });
        window.location="/";
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

        dispatch(openSettingsDialog(defaultTab, true));
    }

    _handleMenu({ key }) {
        if (urls[key]) {
          // console.log('handleMenu:', key);
          location.href = urls[key];
        }
    };
    
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
        const {
            _defaultLogoUrl,
            _disableIntroVideo,
            _features,
            _isNarowLayout,
            _moderatedRoomServiceUrl,
            _jwt,
            _user,
            _virtualAvatarSupport,
            t
        } = this.props;
        const { submitting, currentTenant, room } = this.state;
        const { APP_NAME, DEFAULT_WELCOME_PAGE_LOGO_URL } = interfaceConfig;
        const showAdditionalContent = this._shouldShowAdditionalContent();
        const showAdditionalToolbarContent = this._shouldShowAdditionalToolbarContent();
        const buttons = [];
        const [ tenant ] = room.split('/');
        const avatarColor = getAvatarColor(getInitials(_user?.name), 0.9);
        const siteName = _jwt.siteName || DEFAULT_TENANT;

        const featuresItems = [];
        if (_features?.learnMore) {
            featuresItems.push(
                <Menu.Item
                    className = 'menu-item'
                    key = "learnMore"
                    onClick = {this._getSiteLink}>
                    <Space>
                        {t('toolbar.features.learnMore')}
                    </Space>
                </Menu.Item>
            );
        }
        if (_features?.download) {
            featuresItems.push(
                <Menu.Item
                    className = 'menu-item'
                    key = "downloadManual"
                    onClick = {this._getManualDownloadLink}>
                    <Space>
                        {t('toolbar.features.downloadManual')}
                    </Space>
                </Menu.Item>
            );
        }
        if (!interfaceConfig.HIDE_CONTACT_US) {
            featuresItems.push(
                <Menu.Item
                    className = 'menu-item'
                    key = "support"
                    onClick = {() => {location.href = interfaceConfig.SUPPORT_URL}}>
                    {t('toolbar.features.support')}
                </Menu.Item>
            );
        }

        const features = featuresItems.length > 0 ? <Menu>{featuresItems}</Menu> : null;

        const menu = (
            <Menu onClick = {this._handleMenu}>
                { _features?.learnMore && _isNarowLayout && (
                    <Menu.Item
                        className = 'menu-item'
                        key = "learnMore"
                        onClick = {this._getSiteLink}>
                        <Space>
                            {t('toolbar.features.learnMore')}
                        </Space>
                    </Menu.Item>
                )}
                { _features?.download && _isNarowLayout && (
                    <Menu.Item
                        className = 'menu-item'
                        key = "downloadManual"
                        onClick = {this._getManualDownloadLink}>
                        <Space>
                            {t('toolbar.features.downloadManual')}
                        </Space>
                    </Menu.Item>
                )}
                { _isNarowLayout && interfaceConfig.DISPLAY_CONTACT_US && (
                    <Menu.Item
                        className = 'menu-item'
                        key = "support"
                        onClick = {() => {location.href = interfaceConfig.SUPPORT_URL}}>
                        {t('toolbar.features.support')}
                    </Menu.Item>
                )}
                {_user?.isAdmin && _isNarowLayout && 
                    <Menu.Item className='menu-item mobile' key="admin">
                        {t('welcomepage.adminConsole')}
                    </Menu.Item>}
                {_user?.isSiteStaff &&
                    <Menu.Item className='menu-item' key="sitemanage">
                        {t('welcomepage.siteManage')}
                    </Menu.Item>}
                <Menu.Item className='menu-item' key="meetingmanage">
                    {t('welcomepage.meetingManage')}
                </Menu.Item>
                <Menu.Item className='menu-item' key="account">
                <Space>
                    {t('welcomepage.account')}
                    {_user && currentTenant === DEFAULT_TENANT &&
                    <Badge size='small' count={_user.email_verified ? 0 : 1} />}
                </Space>
                </Menu.Item>
                <Menu.Item className='menu-item' key="logout">
                    {t('toolbar.logout')}
                </Menu.Item>
                { _isNarowLayout && <hr className = 'divider mobile' /> }
                { _isNarowLayout && (
                    <Menu.Item className = 'menu-item mobile' onClick = { this._onOpenSettings }>
                        { t('toolbar.Settings') }
                    </Menu.Item>
                )}
            </Menu>
        );

        if (_user) {
            if (_user.isAdmin) {
                buttons.push(
                    <Button
                        key = 'adminConsole'
                        className = 'button desktop'
                        onClick = {() => this._handleMenu({ key: 'admin' }) }
                        type="text">
                        { t('welcomepage.adminConsole') }
                    </Button>
                );
            }
            buttons.push(
                <div key = 'user-menu-mobile' className = 'button mobile'>
                    <Dropdown
                        className = 'user-container'
                        overlay = {menu}>
                        <Button type="text">
                            <Space>
                                { _user.avatarURL ? (
                                    <img alt = 'avatar' className = 'avatar' src = { _user.avatarURL } />
                                ) : (
                                    <div className='avatar' style={{backgroundColor: avatarColor}}>
                                        {_user.name?.[0] || _user.username[0]}
                                    </div>
                                )}
                                { _user.name }
                                {currentTenant === DEFAULT_TENANT && (
                                    <Badge size='small' count={_user.email_verified ? 0 : 1} />
                                )}
                                <DownOutlined />
                            </Space>
                        </Button>
                    </Dropdown>
                </div>
            );
        } else {
            if (config.useRegistration) {
                buttons.push(
                    <Button
                        className = 'button'
                        onClick = {() => this._handleMenu({ key: 'register' }) }
                        key = 'register'
                        type="text">
                        { t('toolbar.Register') }
                    </Button>
                );
            }
            if (config.useLogin) {
                buttons.push(
                    <Button
                        className = 'button'
                        onClick = {() => this._handleMenu({ key: 'login' }) }
                        key = 'login'
                        type="text">
                        {t('toolbar.login')}
                    </Button>
                );
            }
        }

        return (
            <div
                className = { `welcome ${showAdditionalContent
                    ? 'with-content' : 'without-content'}`
                }
                id = 'welcome_page'>
                <div className = 'header'>
                    <div className = 'container'>
                        <Watermarks
                            className = 'watermark'
                            defaultJitsiLogoURL = { _defaultLogoUrl || DEFAULT_WELCOME_PAGE_LOGO_URL } />
                        <div className = 'toolbars'>
                            { !_isNarowLayout && features && (
                                <div className = 'button desktop'>
                                    <Dropdown
                                        key = 'user-menu-desktop'
                                        overlay = {features}
                                        triggerType = 'button'>
                                        <Button type="text">
                                            {t('toolbar.features.title')}
                                            <DownOutlined />
                                        </Button>
                                    </Dropdown>
                                </div>
                            )}

                            <div className = 'buttons-container'>
                                { buttons }
                                { !_isNarowLayout && (
                                    <Button
                                        className = {_user ? 'button desktop' : 'button'}
                                        onClick = { this._onOpenSettings }
                                        type="text">
                                        { t('toolbar.Settings') }
                                    </Button>
                                )}
                                { showAdditionalToolbarContent
                                    ? <div
                                        className = 'settings-toolbar-content'
                                        ref = { this._setAdditionalToolbarContentRef } />
                                    : null
                                }
                            </div>
                        </div>
                    </div>
                </div>
                <div className = 'welcome-content'>
                    { config.noticeMessage && (
                        <div className = 'banner'>
                            <Alert
                                banner
                                closable
                                message={decodeURIComponent(config.noticeMessage)}
                                type="success" />
                        </div>
                    )}
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
                                <div className = 'enter-room'>
                                    <div className = 'enter-room-input-container'>
                                        <div // virtual input tag to calculate the width of tenant input tag
                                            ref={this._setVirtualTenantRef}
                                            id='virtual_tenant'
                                            className='virtual-tenant'>
                                            {siteName}
                                        </div>
                                        <span>/</span>
                                        <form
                                            className= 'room-form'
                                            onSubmit = { this._onFormSubmit }>
                                            <input
                                                autoFocus = { true }
                                                className = 'enter-room-input'
                                                id = 'enter_room_field'
                                                onChange = { this._onRoomChange }
                                                onClick = { e => e.stopPropagation() }
                                                pattern = { `^[${config.meetingNamePattern || ROOM_NAME_VALIDATE_PATTERN_STR}]+$` }
                                                placeholder = { this.state.roomPlaceholder }
                                                ref = { this._setRoomInputRef }
                                                title = { t('welcomepage.roomNameAllowedChars') }
                                                type = 'text' />
                                            { this._renderInsecureRoomNameWarning() }
                                        </form>
                                    </div>
                                    { tenant && tenant !== currentTenant ? (
                                        <div
                                            className = 'welcome-page-button'
                                            id = 'enter_room_button'
                                            onClick = { this._onFormSubmit }>
                                            { t('welcomepage.join') }
                                        </div>
                                    ) : (
                                        <div
                                            className = 'welcome-page-button'
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
                                <div className = 'help-message'>
                                    {t('welcomepage.enterRoomTitle')}
                                </div>
                            </div>
                            <div className = 'header-image'>
                                { _disableIntroVideo ? (
                                    <img
                                        alt = 'Video conference'
                                        src = '/images/header-image.png' />
                                ) : (
                                    <iframe
                                        src="https://www.youtube.com/embed/3Z-bkgjYUTc"
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen />
                                )}
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
                    <div className = 'footer'>
                        <div className = 'container'>
                            <div className = 'copyright'>
                                {t('footer.copyright', { year: interfaceConfig.COPYRIGHT_YEAR || '2025', provider: interfaceConfig.PROVIDER_NAME || '(주)케이에듀텍' })}
                            </div>
                            {interfaceConfig.ADDITIONAL_FOOTER && (
                                <div className = 'additional-footer'>
                                    {interfaceConfig.ADDITIONAL_FOOTER}
                                </div>
                            )}
                            <div className = 'nav'>
                                {!interfaceConfig.HIDE_TOC && <a href = { `${AUTH_PAGE_BASE}/tos` }>{t('footer.tos')}</a>}
                                {!interfaceConfig.HIDE_PRIVACY && <a href = { `${AUTH_PAGE_BASE}/privacy` }>{t('footer.privacy')}</a>}
                                {!interfaceConfig.HIDE_CONTACT_US && <a
                                    alt = { t('footer.contactUs') }
                                    href = { interfaceConfig.SUPPORT_URL }>
                                    {t('footer.contactUs')}
                                </a>}
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
                    { this.props.t('security.insecureRoomNameWarningWeb') }
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

        const forbiddenChars = new RegExp(`[^${config.meetingNamePattern || ROOM_NAME_VALIDATE_PATTERN_STR}]`, 'ig');
        const replacedStr =  event.currentTarget.value.replaceAll(forbiddenChars, '');
        this._roomInputRef.value = replacedStr; // removes forbidden characters

        super._onRoomChange(`${this.state.currentTenant}/${replacedStr}`);
    }

    /**
     * Overrides the super to implement the tenant(site or license) feature
     *
     * Handles joining. Either by clicking on 'Join' button
     * or by pressing 'Enter' in room name input field.
     * @inheritdoc
     * @override
     * @protected
     * @returns {void}
     */
    _onJoin() {
        const roomname = this._roomInputRef.value || this.state.generatedRoomname; // value at the roomname input tag
        const { currentTenant } = this.state;

        this.setState(() => ({ room: `${currentTenant}/${roomname}` }), () => {
            super._onJoin();
        });
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

    _handleKeyPress = ev => {
        if (ev.key === 'Escape') {
            this._roomInputRef.blur();
        }
    }

    /**
     * Renders the footer.
     *
     * @returns {ReactElement}
     */
    _renderFooter() {
        const { t } = this.props;
        const {
            MOBILE_DOWNLOAD_LINK_ANDROID,
            MOBILE_DOWNLOAD_LINK_F_DROID,
            MOBILE_DOWNLOAD_LINK_IOS
        } = interfaceConfig;

        return (<footer className = 'welcome-footer'>
            <div className = 'welcome-footer-centered'>
                <div className = 'welcome-footer-padded'>
                    <div className = 'welcome-footer-row-block welcome-footer--row-1'>
                        <div className = 'welcome-footer-row-1-text'>{t('welcomepage.jitsiOnMobile')}</div>
                        <a
                            className = 'welcome-badge'
                            href = { MOBILE_DOWNLOAD_LINK_IOS }>
                            <img
                                alt = { t('welcomepage.mobileDownLoadLinkIos') }
                                src = './images/app-store-badge.png' />
                        </a>
                        <a
                            className = 'welcome-badge'
                            href = { MOBILE_DOWNLOAD_LINK_ANDROID }>
                            <img
                                alt = { t('welcomepage.mobileDownLoadLinkAndroid') }
                                src = './images/google-play-badge.png' />
                        </a>
                        <a
                            className = 'welcome-badge'
                            href = { MOBILE_DOWNLOAD_LINK_F_DROID }>
                            <img
                                alt = { t('welcomepage.mobileDownLoadLinkFDroid') }
                                src = './images/f-droid-badge.png' />
                        </a>
                    </div>
                </div>
            </div>
        </footer>);
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
     * additional card shown near the tabs card.
     *
     * @param {HTMLDivElement} el - The HTMLElement for the div that is the root
     * of the welcome page content.
     * @private
     * @returns {void}
     */
    _setAdditionalCardRef(el) {
        this._additionalCardRef = el;
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

    _setVirtualTenantRef(el) {
        this._virtualTenantRef = el;
    }

    /**
     * Returns whether or not an additional card should be displayed near the tabs.
     *
     * @private
     * @returns {boolean}
     */
    _shouldShowAdditionalCard() {
        return interfaceConfig.DISPLAY_WELCOME_PAGE_ADDITIONAL_CARD
            && this._additionalCardTemplate
            && this._additionalCardTemplate.content
            && this._additionalCardTemplate.innerHTML.trim();
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
