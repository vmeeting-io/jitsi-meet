/* eslint-disable require-jsdoc */
// @flow

import React, { Component } from 'react';
import { SafeAreaView, ScrollView, Text } from 'react-native';

import api from '../../../api';
import tokenLocalStorage from '../../../api/tokenLocalStorage';
import { setScreen } from '../../../redux/screen/screen';
import { Avatar } from '../../base/avatar';
import { IconSettings, IconHelp } from '../../base/icons';
import { setJWT } from '../../base/jwt';
import { setActiveModalId } from '../../base/modal';
import {
    getLocalParticipant,
    getParticipantDisplayName
} from '../../base/participants';
import {
    Header,
    SlidingView
} from '../../base/react';
import { connect } from '../../base/redux';
import { HELP_VIEW_MODAL_ID } from '../../help';
import { SETTINGS_VIEW_ID } from '../../settings/constants';
import { setSideBarVisible } from '../actions';

import SideBarItem from './SideBarItem';
import styles, { SIDEBAR_AVATAR_SIZE } from './styles';

/**
 * The URL at which the privacy policy is available to the user.
 */
// const PRIVACY_URL = 'https://jitsi.org/meet/privacy';

/**
 * The URL at which the terms (of service/use) are available to the user.
 */
// const TERMS_URL = 'https://jitsi.org/meet/terms';

type Props = {

    /**
     * Redux dispatch action
     */
    dispatch: Function,

    /**
     * Display name of the local participant.
     */
    _displayName: ?string,

    /**
     * ID of the local participant.
     */
    _localParticipantId: ?string,

    /**
     * Sets the side bar visible or hidden.
     */
    _visible: boolean,

    _user: Object,

    _logout: Function,

    _removeToken: Function,
};

/**
 * A component rendering a welcome page sidebar.
 */
class WelcomePageSideBar extends Component<Props> {
    /**
     * Constructs a new SideBar instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onHideSideBar = this._onHideSideBar.bind(this);
        this._onOpenHelpPage = this._onOpenHelpPage.bind(this);
        this._onOpenSettings = this._onOpenSettings.bind(this);
        this._onOpenAccountSettings = this._onOpenAccountSettings.bind(this);
        this._onLogout = this._onLogout.bind(this);
        this._onLogin = this._onLogin.bind(this);

        // this._onRegister = this._onRegister.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}, renders the sidebar.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <SlidingView
                onHide = { this._onHideSideBar }
                show = { this.props._visible }
                style = { styles.sideBar } >
                <Header style = { styles.sideBarHeader }>
                    <Avatar
                        participantId = { this.props._localParticipantId }
                        size = { SIDEBAR_AVATAR_SIZE } />
                    <Text style = { styles.displayName }>
                        { this.props._displayName }
                    </Text>
                </Header>
                <SafeAreaView style = { styles.sideBarBody }>
                    <ScrollView
                        style = { styles.itemContainer }>
                        <SideBarItem
                            icon = { IconSettings }
                            label = 'settings.title'
                            onPress = { this._onOpenSettings } />
                        {/* {this.props._user && <SideBarItem
                            icon = {IconSettings}
                            label = 'Account'
                            onPress = {this._onOpenAccountSettings}
                        />} */}
                        {/* <SideBarItem
                            icon = { IconInfo }
                            label = 'welcomepage.terms'
                            url = { TERMS_URL } /> */}
                        {/* <SideBarItem
                            icon = { IconInfo }
                            label = 'welcomepage.privacy'
                            url = { PRIVACY_URL } /> */}
                        {/* {!this.props._user && <SideBarItem
                            icon = { IconSettings }
                            label = 'Login'
                            onPress = { this._onLogin } />} */}
                        {/* {!this.props._user && <SideBarItem
                            icon = { IconSettings }
                            label = 'Register'
                            onPress = { this._onRegister } />} */}
                        <SideBarItem
                            icon = { IconHelp }
                            label = 'welcomepage.getHelp'
                            onPress = { this._onOpenHelpPage } />
                        {/* {this.props._user && <SideBarItem
                            icon = { IconSettings }
                            label = 'toolbar.logout'
                            onPress = { this._onLogout } />} */}
                    </ScrollView>
                </SafeAreaView>
            </SlidingView>
        );
    }

    _onHideSideBar: () => void;

    /**
     * Invoked when the sidebar has closed itself (e.g. Overlay pressed).
     *
     * @private
     * @returns {void}
     */
    _onHideSideBar() {
        this.props.dispatch(setSideBarVisible(false));
    }

    _onOpenHelpPage: () => void;

    /**
     * Shows the {@link HelpView}.
     *
     * @returns {void}
     */
    _onOpenHelpPage() {
        const { dispatch } = this.props;

        dispatch(setSideBarVisible(false));
        dispatch(setActiveModalId(HELP_VIEW_MODAL_ID));
    }

    _onOpenSettings: () => void;

    /**
     * Shows the {@link SettingsView}.
     *
     * @private
     * @returns {void}
     */
    _onOpenSettings() {
        const { dispatch } = this.props;

        dispatch(setSideBarVisible(false));
        dispatch(setActiveModalId(SETTINGS_VIEW_ID));
    }

    _onOpenAccountSettings: () => void;

    _onOpenAccountSettings() {
        const { dispatch } = this.props;

        dispatch(setScreen('AccountSetting'));
    }

    _onLogout: () => void;

    _onLogout() {
        const { dispatch, _logout, _removeToken } = this.props;

        _logout().then(() => {
            _removeToken();
            dispatch(setJWT());
            dispatch(setSideBarVisible(false));
        });
    }

    _onLogin: () => void;

    _onLogin() {
        const { dispatch } = this.props;

        dispatch(setScreen('Login'));
    }

    // _onRegister: () => void;

    // _onRegister() {
    //   const { dispatch } = this.props;
    //   dispatch(setScreen("Register"));
    // }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @protected
 * @returns {Props}
 */
function _mapStateToProps(state: Object) {
    const _localParticipant = getLocalParticipant(state);
    const _localParticipantId = _localParticipant?.id;
    const _displayName = _localParticipant && getParticipantDisplayName(state, _localParticipantId);

    return {
        _displayName,
        _localParticipantId,
        _visible: state['features/welcome'].sideBarVisible,
        _user: state['features/base/jwt'].user,
        _logout: () => api.logout(state),
        _removeToken: () => tokenLocalStorage.removeItem(state)
    };
}

export default connect(_mapStateToProps)(WelcomePageSideBar);
