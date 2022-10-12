/* global APP, interfaceConfig, process */

import Badge from '@atlaskit/badge';
import Banner from '@atlaskit/banner';
import Button, { ButtonGroup } from '@atlaskit/button';
import DropdownMenu, { DropdownItem, DropdownItemGroup } from '@atlaskit/dropdown-menu';
import { jitsiLocalStorage } from '@jitsi/js-utils';
import axios from 'axios';
import React from 'react';

import tokenLocalStorage from '../../../api/tokenLocalStorage';
import { getAvatarColor, getInitials } from '../../base/avatar';
import { translate, translateToHTML } from '../../base/i18n';
import { Icon, IconWarning } from '../../base/icons';
import { setJWT } from '../../base/jwt';
import { Watermarks } from '../../base/react';
import { connect } from '../../base/redux';
import { openDialog } from '../../base/dialog';
import { CalendarList } from '../../calendar-sync';
import { NOTIFICATION_TYPE, showSweetAlert } from '../../notifications';
import { NotificationsContainer } from '../../notifications/components';
import { RecentList } from '../../recent-list';
import { SETTINGS_TABS } from '../../settings';
import { openSettingsDialog } from '../../settings/actions';
import { checkBlurSupport, VirtualBackgroundDialog } from '../../virtual-background';
import { VirtualAvatarDialog } from '../../virtual-avatar';

import { AbstractWelcomePage, _mapStateToProps } from './AbstractWelcomePage';
import NoticeDialog from './NoticeDialog';
import Tabs from './Tabs';
//import alarmImg from '../../../../resources/img/appstore-badge.png';

/**
 * The pattern used to validate room name.
 * alphabet, number, korean and underscore are allowed
 * @type {string}
 */
export const ROOM_NAME_VALIDATE_PATTERN_STR = '^[a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣_]+$';
// export const ROOM_NAME_VALIDATE_PATTERN_STR = '^[a-zA-Z0-9가-힣_]+$'; // this allows alphabet, numbers, underscore and completed korean
// export const ROOM_NAME_VALIDATE_PATTERN_STR = '^[a-zA-Z0-9_]+$'; // this allows alphabet, numbers and underscore only

const AUTH_PAGE_BASE = window._env_.VMEETING_FRONT_BASE;
const AUTH_API_BASE = window._env_.VMEETING_API_BASE;
const DEFAULT_TENANT = window._env_.DEFAULT_SITE_ID;


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
        this._onVirtualBackground = this._onVirtualBackground.bind(this);
        this._onVirtualAvatar = this._onVirtualAvatar.bind(this);
        this._onLogout = this._onLogout.bind(this);
        this._onOpenChange = this._onOpenChange.bind(this);
        this._onOpenSettings = this._onOpenSettings.bind(this);
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
        const krLink = window.config.features.download.krLink;
        const enLink = window.config.features.download.enLink;
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
        const krLink = window.config.features.learnMore.krLink;
        const enLink = window.config.features.learnMore.enLink;
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

    _onVirtualBackground(){
        const { dispatch } = this.props;

        dispatch(openDialog(VirtualBackgroundDialog));
    }

    _onVirtualAvatar() {
        const { dispatch } = this.props;

        dispatch(openDialog(VirtualAvatarDialog));
    }

    _onOpenChange() {
        document.activeElement.blur();
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
        const {
            _defaultLogoUrl,
            _disableIntroVideo,
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

        if (_user) {
            if (_user.isAdmin) {
                buttons.push(
                    <Button
                        key = 'adminConsole'
                        appearance = 'subtle'
                        className = 'button desktop'
                        href = { `${AUTH_PAGE_BASE}/admin/rooms` }>
                        { t('welcomepage.adminConsole') }
                    </Button>
                );
            }
            buttons.push(
                <div key = 'user-menu-mobile' className = 'button mobile'>
                    <DropdownMenu
                        onOpenChange = { this._onOpenChange }
                        position = "bottom right"
                        isLoading = { submitting }
                        trigger = {
                            <div className = 'user-container'>
                                { _user.avatarURL ? (
                                    <img
                                        alt = 'avatar'
                                        className = 'avatar'
                                        src = { _user.avatarURL } />
                                ) : (
                                    <div className='avatar' style={{backgroundColor: avatarColor}}>
                                        {_user.name?.[0] || _user.username[0]}
                                    </div>
                                )}
                                { _user.name }
                                { (!_user.email_verified && currentTenant === DEFAULT_TENANT) && (
                                    <div className = 'badge'>
                                        <Badge appearance="important">{1}</Badge>
                                    </div>
                                )}
                            </div>
                        }
                        triggerType = 'button'>
                        <DropdownItemGroup className = 'menu-container'>
                            <DropdownItem
                                className = 'menu-item mobile'
                                onClick = { this._getSiteLink }>
                                { t('toolbar.features.learnMore') }
                            </DropdownItem>

                            <DropdownItem
                                className = 'menu-item mobile'
                                onClick = { this._getManualDownloadLink }>
                                { t('toolbar.features.downloadManual') }
                            </DropdownItem>

                            <DropdownItem
                                className = 'menu-item mobile'
                                href = { "mailto:vmeeting-info@kedutech.kr"} >
                                {t('toolbar.features.support')}
                            </DropdownItem>
                            <hr className = 'divider mobile' />
                        </DropdownItemGroup>
                        { _user.isAdmin &&
                            <DropdownItemGroup className = 'menu-container'>
                                <DropdownItem
                                    className = 'menu-item mobile'
                                    href = { `${AUTH_PAGE_BASE}/admin/rooms` }>
                                    {t('welcomepage.adminConsole')}
                                </DropdownItem>
                                <hr className = 'divider mobile' />
                            </DropdownItemGroup> }
                        <DropdownItemGroup className = 'menu-container'>
                            {_user.isSiteStaff && (
                                <DropdownItem
                                    className = 'menu-item'
                                    href = { `${AUTH_PAGE_BASE}/sitemanage` }>
                                    { t('welcomepage.siteManage') }
                                </DropdownItem>
                            )}
                            <DropdownItem
                                className = 'menu-item'
                                href = { `${AUTH_PAGE_BASE}/meetingmanage` }>
                                { t('welcomepage.meetingManage') }
                            </DropdownItem>
                            <DropdownItem
                                className = 'menu-item'
                                href = { `${AUTH_PAGE_BASE}/account` }>
                                { t('welcomepage.account') }
                                {(!_user.email_verified && currentTenant === DEFAULT_TENANT) && (
                                    <div className = 'badge'>
                                        <Badge appearance="important">{1}</Badge>
                                    </div>
                                )}
                            </DropdownItem>
                            { _virtualAvatarSupport ? (
                                <DropdownItem
                                    className='menu-item'
                                    onClick={this._onVirtualAvatar}>
                                    {t('toolbar.selectVirtualAvatar')}
                                </DropdownItem>
                            ) : (checkBlurSupport() && (
                                <DropdownItem
                                    className = 'menu-item'
                                    onClick = { this._onVirtualBackground }>
                                    { t('toolbar.selectBackground') }
                                </DropdownItem>
                            ))}
                            <DropdownItem
                                className = 'menu-item'
                                onClick = { this._onLogout }>
                                { t('toolbar.logout') }
                            </DropdownItem>
                            <hr className = 'divider mobile' />
                            <DropdownItem
                                className = 'menu-item mobile'
                                onClick = { this._onOpenSettings }>
                                { t('toolbar.Settings') }
                            </DropdownItem>
                        </DropdownItemGroup>
                    </DropdownMenu>
                </div>
            );
        } else {
            if (!config.disableUserRegistration) {
                buttons.push(
                    <Button
                        appearance = 'subtle'
                        className = 'button'
                        href = { `${AUTH_PAGE_BASE}/register` }
                        key = 'register'>
                        { t('toolbar.Register') }
                    </Button>
                );
            }
            buttons.push(
                <Button
                    appearance = 'subtle'
                    className = 'button'
                    href = { `${AUTH_PAGE_BASE}/login` }
                    key = 'login'>
                    {t('toolbar.login')}
                </Button>
            );
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
                            <div className = 'button desktop'>
                                <DropdownMenu
                                    onOpenChange = { this._onOpenChange }
                                    position = "bottom left"
                                    key = 'user-menu-desktop'
                                    trigger = {
                                        <div id="featureDropdown" className = 'feature'>
                                            {t('toolbar.features.title')}
                                        </div>
                                    }
                                    triggerType = 'button'>
                                    <DropdownItemGroup className = 'menu-container'>
                                        <DropdownItem
                                            className = 'menu-item'
                                            onClick = { this._getSiteLink }>
                                            { t('toolbar.features.learnMore') }
                                        </DropdownItem>

                                        <DropdownItem
                                            className = 'menu-item'
                                            onClick = { this._getManualDownloadLink }>
                                            { t('toolbar.features.downloadManual') }
                                        </DropdownItem>


                                        <DropdownItem
                                            className = 'menu-item'
                                            href = { "mailto:vmeeting-info@kedutech.kr"} >
                                            {t('toolbar.features.support')}
                                        </DropdownItem>
                                    </DropdownItemGroup>
                                </DropdownMenu>
                            </div>

                            <ButtonGroup>
                                {/* <Button
                                    appearance = 'subtle'
                                    className = {_user ? 'button desktop' : 'button'}
                                    href = { `${AUTH_PAGE_BASE}/features` }>
                                    {t('toolbar.features')}
                                </Button> */}
                                { buttons }
                                <Button
                                    appearance = 'subtle'
                                    className = {_user ? 'button desktop' : 'button'}
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
                    { config.noticeMessage && (
                        <div className = 'banner'>
                            <Banner appearance="announcement" isOpen>
                                {decodeURIComponent(config.noticeMessage)}
                            </Banner>
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
                                {t('footer.copyright', { provider: interfaceConfig.PROVIDER_NAME || '(주)케이에듀텍' })}
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
                <NoticeDialog />
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

        const forbiddenChars = /[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣_]/ig;
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
