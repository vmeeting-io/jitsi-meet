/* @flow */

import React, { Component } from 'react';

import { translate } from '../../../base/i18n/functions';
import Icon from '../../../base/icons/components/Icon';
import { IconFaceSmile } from '../../../base/icons/svg';
import Tooltip from '../../../base/tooltip/components/Tooltip';


/**
 * Implements a React {@link Component} which displays a button for uploading a file in a chatroom
 *
 */
function SmileysButton(props) {
    return (
        <div className = 'smiley-button'>
            <Tooltip
                content = { props.t('chat.smileys') }
                position = 'top'>
                <div
                    aria-expanded = { props.showSmileysPanel }
                    aria-haspopup = 'smileysContainer'
                    aria-label = { props.t('chat.smileysPanel') }
                    className = 'smiley-button'
                    onClick = { props.onClick }
                    onKeyDown = { props.onEscHandler }
                    onKeyPress = { props.onToggleSmileysPanelKeyPress }
                    role = 'button'
                    tabIndex = { 0 }>
                    <Icon src = { IconFaceSmile } />
                </div>
            </Tooltip>
        </div>
    );
}

export default translate(SmileysButton);
