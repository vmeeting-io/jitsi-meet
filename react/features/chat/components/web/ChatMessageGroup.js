import clsx from 'clsx';
import React from 'react';
import { Dropdown, Menu } from 'antd';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import Avatar from '../../../base/avatar/components/Avatar';
import { openDialog as openDialogAction } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import { getLocalParticipant, getParticipantById } from '../../../base/participants/functions';
import KickRemoteParticipantDialog from '../../../video-menu/components/web/KickRemoteParticipantDialog';

import { setPrivateMessageRecipient as setPrivateMessageRecipientAction } from '../../actions.any';
import ChatMessage from './ChatMessage';

const useStyles = makeStyles()(theme => {
    return {
        messageGroup: {
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '100%',

            '&.remote': {
                maxWidth: 'calc(100% - 40px)' // 100% - avatar and margin
            }
        },

        groupContainer: {
            display: 'flex',

            '&.local': {
                justifyContent: 'flex-end',

                '& .avatar': {
                    display: 'none'
                }
            }
        },

        avatar: {
            cursor: 'pointer',
            margin: `${theme.spacing(1)} ${theme.spacing(2)} ${theme.spacing(3)} 0`,
            // position: 'sticky',
            flexShrink: 0,
            top: 0
        }
    };
});


const ChatMessageGroup = ({
    _isLocal,
    _isLocalParticipantAModerator,
    _participant,
    className = '',
    messages,
    openDialog,
    setPrivateMessageRecipient,
    t
}) => {
    const { classes } = useStyles();
    const messagesLength = messages.length;

    if (!messagesLength) {
        return null;
    }

    const menu = (
        <Menu>
            <Menu.Item key="private-message"
                onClick={() => openDialog(KickRemoteParticipantDialog, { participantID: messages[0].id })}>
                {t('toolbar.privateMessage')}
            </Menu.Item>
            { _isLocalParticipantAModerator && 
                <Menu.Item key="kick-out"
                    onClick={() => setPrivateMessageRecipient(_participant)}>
                    {t('dialog.kickOut')}
                </Menu.Item> }
        </Menu>
    );

    const renderAvatar = () => {
        return (
            <Dropdown overlay={menu}>
                <Avatar
                    className = { clsx(classes.avatar, 'avatar') }
                    participantId = { messages[0].id }
                    size = { 32 } />
            </Dropdown>
        );
    }

    const renderDisplayName = ({ displayName }) => {
        return (
            <Dropdown overlay={menu}>
                <div
                    aria-hidden = { true }
                    className = 'display-name'>
                    { displayName }
                </div>
            </Dropdown>
        );
        // return (
        //     <div
        //         aria-hidden = { true }
        //         className = 'display-name'>
        //         { displayName }
        //     </div>
        // );
    }

    return (
        <div className = { clsx(classes.groupContainer, className) }>
            { !_isLocal && renderAvatar() }
            <div className = { `${classes.messageGroup} chat-message-group ${className}` }>
                { !_isLocal && renderDisplayName(messages[0]) }
                {messages.map((message, i) => (
                    <ChatMessage
                        key = { i }
                        message = { message }
                        showDisplayName = { i === 0 }
                        showTimestamp = { i === messages.length - 1 }
                        type = { className } />
                ))}
            </div>
        </div>
    );
};

function _mapDispatchToProps(dispatch) {
    return {
        openDialog: (component, args) => {
            dispatch(openDialogAction(component, args));
        },

        setPrivateMessageRecipient: (participant) => {
            dispatch(setPrivateMessageRecipientAction(participant));
        }
    };
}

function _mapStateToProps(state, ownProps) {
    const participantID = ownProps.messages[0].id;
    const participant = getParticipantById(state, participantID);
    const localParticipant = getLocalParticipant(state);

    return {
        _isLocalParticipantAModerator: Boolean(localParticipant.role === 'moderator'),
        _isLocal: localParticipant.id === participantID,
        _participant: participant,
    };
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(ChatMessageGroup));
