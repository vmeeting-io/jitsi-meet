// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';
import { IconCloseLarge, IconSearch } from '../../../base/icons/svg';
import { toggleChat } from '../../actions.web';

type Props = {

    /**
     * An optional class name.
     */
    className: string,

    /**
     * Whether the polls feature is enabled or not.
     */
    isPollsEnabled: boolean,

    /**
     * Function to be called when pressing the close button.
     */
    onCancel: Function,
};

const useStyles = makeStyles()(theme => {
    return {
        toolContainer: {
            display: 'flex',
            fontSize: 14,
            fontWeight: 400,
            gap: 10
        }
    };
});

/**
 * Custom header of the {@code ChatDialog}.
 *
 * @returns {React$Element<any>}
 */
function ChatHeader({
    className,
    isPollsEnabled,
    onToggleSearch,
    renderSearch,
    showSearch,
}: Props) {

    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { classes } = useStyles();

    const onCancel = useCallback(() => {
        dispatch(toggleChat());
    }, []);

    const onKeyPressHandler = useCallback(e => {
        if (onCancel && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onCancel();
        }
    }, []);

    return (
        <div
            className = { className || 'chat-dialog-header' }>
            { !showSearch
                ? (
                    <span
                        aria-level = { 1 }
                        role='heading'>
                        {/* [daisy] 채팅 기능 삭제 */}
                        {/* { t(isPollsEnabled ? 'chat.titleWithPolls' : 'chat.title') } */}
                    </span>
                ) : renderSearch() }
            <div className = { classes.toolContainer }>
                { !showSearch && <Icon
                    ariaLabel = { t('chat.search') }
                    onClick={ onToggleSearch }
                    role = 'button'
                    src = { IconSearch }
                    tabIndex = { 0 } /> }
                <Icon
                    ariaLabel = { t('toolbar.closeChat') }
                    onClick = { onCancel }
                    onKeyPress = { onKeyPressHandler }
                    role = 'button'
                    src = { IconCloseLarge }
                    tabIndex = { 0 } />
            </div>
        </div>
    );
}

export default ChatHeader;
