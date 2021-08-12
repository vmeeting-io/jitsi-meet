/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-no-bind */
import { StyleSheet, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import DeviceInfo from 'react-native-device-info';
import Orientation from '@dachongziy/react-native-orientation';
import { WebView } from 'react-native-webview';
import { useSelector, useStore } from 'react-redux';

import { getLocationURL } from '../../api/url';

const LoginWebView = ({ onReceiveToken }) => {
    const { authRequired } = useSelector(store => store)['features/base/conference'];
    const room = authRequired && authRequired.getName();

    const store = useStore();
    const [ userAgent, setUserAgent ] = useState();
    const loginURL = `${getLocationURL(store.getState())}/auth/page/login?next=${room}`;

    const onMessage = event => {
        onReceiveToken(event.nativeEvent.data);
    };

    useEffect(() => {
        DeviceInfo.getUserAgent()
        .then(res => {
            setUserAgent(res);
        })
        .catch(err => console.log(err));

        const isTablet = DeviceInfo.isTablet();
        if (!isTablet) {
            Orientation.lockToPortrait();
    
            return function willUnmount() {
                Orientation.unlockAllOrientations();
            };
        }
    }, []);

    const style = {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        flex: 0,
        height: '100%',
        overflowY: 'auto'
    };

    return (
        <View
            style = { style }>
            <WebView
                onMessage = { onMessage }
                source = {{
                    uri: loginURL,
                    origin: loginURL
                }}
                startInLoadingState = { true }
                useWebView = { userAgent && userAgent.match(/iP(ad|hone|od)/i) }
                userAgent = { userAgent } />
        </View>
    );
};

export default LoginWebView;
