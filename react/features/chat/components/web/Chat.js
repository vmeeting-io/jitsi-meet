// @flow

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { isEnabledFromState } from '../../../av-moderation/functions';
import { translate } from '../../../base/i18n/functions';
import Icon from '../../../base/icons/components/Icon';
import { IconCloseSolid, IconSearch } from '../../../base/icons/svg';
import { PARTICIPANT_ROLE } from '../../../base/participants/constants'
import { getLocalParticipant } from '../../../base/participants/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Input from '../../../base/ui/components/web/Input';
import Tabs from '../../../base/ui/components/web/Tabs';
import { arePollsDisabled } from '../../../conference/functions.any';
import PollsPane from '../../../polls/components/web/PollsPane';
import { sendMessage, setChatTabFocused, toggleChat } from '../../actions.web';
import { CHAT_SIZE, CHAT_TABS, SMALL_WIDTH_THRESHOLD } from '../../constants';
import { uploadFile } from '../../functions';

import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import DisplayNameForm from './DisplayNameForm';
import KeyboardAvoider from './KeyboardAvoider';
import MessageContainer from './MessageContainer';
import MessageRecipient from './MessageRecipient';

import { NOTIFICATION_TIMEOUT } from '../../../notifications/constants';
import { showToast } from '../../../notifications/functions.web';

import Mark from 'mark.js';
import DragAndDrop from './DragAndDrop';

import STTMessageContainer from '../../../speech-to-text/components/stt-pane/STTMessageContainer';

declare var APP: Object;

const useStyles = makeStyles()(theme => {
    return {
        container: {
            backgroundColor: theme.palette.ui01,
            flexShrink: 0,
            overflow: 'hidden',
            position: 'relative',
            transition: 'width .16s ease-in-out',
            width: `${CHAT_SIZE}px`,
            zIndex: 300,

            '@media (max-width: 580px)': {
                height: '100dvh',
                position: 'fixed',
                left: 0,
                right: 0,
                top: 0,
                width: 'auto'
            },

            '*': {
                userSelect: 'text',
                WebkitUserSelect: 'text'
            }
        },

        chatHeader: {
            height: '60px',
            position: 'relative',
            width: '100%',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            padding: theme.spacing(3),
            alignItems: 'center',
            boxSizing: 'border-box',
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.heading6),

            '.jitsi-icon': {
                cursor: 'pointer'
            }
        },

        chatPanel: {
            display: 'flex',
            flexDirection: 'column',

            // extract header + tabs height
            height: 'calc(100% - 110px)'
        },

        chatPanelNoTabs: {
            // extract header height
            height: 'calc(100% - 60px)'
        },

        pollsPanel: {
            // extract header + tabs height
            height: 'calc(100% - 110px)'
        },

        searchContainer: {
            position: 'relative',
            flexGrow: 1,
            marginRight: 10
        },

        searchInput: {
            input: {
                paddingRight: 40
            }
        },

        closeIcon: {
            cursor: 'pointer',
            position: 'absolute',
            right: 10,
            top: 10,
            color: 'gray'
        }
    };
});

const Chat = ({
    _fileName,
    _fileSize,
    _fileUploadInProgress,
    _fileUploadPercentage,
    _isFileDownloadEnabled,
    _isModal,
    _isOpen,
    _isPollsEnabled,
    _isSTTEnabled,
    _isUploading,
    _messages,
    _nbUnreadMessages,
    _nbUnreadPolls,
    _showChatInput,
    _showNamePrompt,
    _STTmessages,
    _tabFocused,
    dispatch,
    t
}) => {
    const { classes, cx, theme } = useStyles();
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResultCount, setSearchResultCount] = useState(0);
    const [searchResultIndex, setSearchResultIndex] = useState(-1);
    const [currentIdx, setCurrentIdx] = useState(-1);
    const searchInputRef = useRef();

    // const messageContainerRef = useRef();
    // const STTmessageContainerRef = useRef();

    // useEffect(() => {
    //     scrollMessageContainerToBottom(true);
    //     scrollSTTMessageContainerToBottom(true);
    //     document.addEventListener('keypress', handleKeyPress);
    //     document.addEventListener('keydown', handleKeyDown);

    //     return () => {
    //         document.removeEventListener('keypress', handleKeyPress);
    //         document.removeEventListener('keydown', handleKeyDown);
    //     }
    // }, []);

    // useEffect(() => {
    //     scrollMessageContainerToBottom(false);
    //     scrollSTTMessageContainerToBottom(false);
    // }, [ _messages, _STTmessages, _isOpen ])

    const handleKeyPressOnSearch = ev => {
        if (!showSearch) return;

        if (ev.key === "Enter") {
            handleChatSearchInput();

            // count the occurences of search query
            countSearchOccurences();
            nextResult(ev);
        }
    };

    // const handleKeyDown = ev => {
    //     if (showSearch && ev.key === 'Escape') {
    //         onToggleSearch();
    //         resetSearchResultIndex();
    //     }
    // };

    /**
    * Sends a text message.
    *
    * @private
    * @param {string} text - The text message to be sent.
    * @returns {void}
    * @type {Function}
    */
    const onSendMessage = useCallback((text: string) => {
        dispatch(sendMessage(text));
    }, []);

    /**
    * Toggles the chat window.
    *
    * @returns {Function}
    */
    const onToggleChat = useCallback(() => {
        dispatch(toggleChat());
    }, []);

    /**
     * Click handler for the chat sidenav.
     *
     * @param {KeyboardEvent} event - Esc key click to close the popup.
     * @returns {void}
     */
    const onEscClick = useCallback((event) => {
        if (event.key === 'Escape' && _isOpen) {
            event.preventDefault();
            event.stopPropagation();
            onToggleChat();
        }
    }, [ _isOpen ]);

    /**
     * Change selected tab.
     *
     * @param {string} id - Id of the clicked tab.
     * @returns {void}
     */
    const onChangeTab = useCallback((id: string) => {
        dispatch(setChatTabFocused(id));
    }, []);

    /**
     * Callback invoked when search button clicked.
     *
     * @private
     * @returns {void}
     */
    const onToggleSearch = () => {
        setShowSearch(!showSearch);

        if (showSearch) {
            setSearchQuery('');
            clearHighlightText();
        } else {
            setTimeout(() => {
                searchInputRef.current?.focus();
            });
        }
    }

    /**
     * Returns a React Element for showing chat messages and a form to send new
     * chat messages.
     *
     * @private
     * @returns {ReactElement}
     */
    function renderChat() {
        if (_tabFocused === CHAT_TABS.POLLS) {
            return (
                <>
                    { renderTabs() }
                    <div
                        area-labelledby = 'polls-tab'
                        id = 'polls-panel'
                        role = 'tabpanel'>
                        <PollsPane />
                    </div>
                    <KeyboardAvoider />
                </>
            );
        }

        if (_tabFocused === CHAT_TABS.STT) {
            return (
                <>
                    { renderTabs() }
                    <div
                        area-labelledby = 'stt-tab'
                        id = 'stt-panel'
                        role = 'tabpanel'>
                    </div>
                    <STTMessageContainer
                        messages = { _STTmessages }
                        // ref = { STTmessageContainerRef }
                    />
                    <KeyboardAvoider />
                </>
            );
        }

        return (
            <>
                { renderTabs() }
                <DragAndDrop
                    disabled = { !_isFileDownloadEnabled }
                    dropString = { t('chat.dropFiles') }
                    handleDrop = { _fileDropHandler }>
                    <MessageContainer
                        fileUploadPercentage = { _fileUploadPercentage }
                        fileName = { _fileName }
                        fileSize = { _fileSize }
                        isUploading = { _isUploading }
                        messages = { _messages }
                        // ref = { messageContainerRef }
                    />
                    <MessageRecipient />
                    {_showChatInput && (
                        <>
                            <ChatInput
                                onSend = { onSendMessage } />
                            <KeyboardAvoider />
                        </>
                    )}
                </DragAndDrop>
            </>
        );
    }

    const _fileDropHandler = (file) => {
        uploadFile(file, APP.store, _fileUploadInProgress);
    };

    const renderSearch = () => {
        return (
            <div className = { classes.searchContainer }>
                <Input
                    autoComplete = 'off'
                    autoFocus = { false }
                    className = { classes.searchInput }
                    icon = { IconSearch }
                    id = 'chat-header-search'
                    name = 'chatSearch'
                    onChange = { updateChatSearchInput }
                    onKeyPress = { handleKeyPressOnSearch }
                    placeholder = { t('chat.search') }
                    ref = { searchInputRef }
                    value = { searchQuery } />
                <Icon
                    className = { classes.closeIcon }
                    onClick = { onToggleSearch }
                    size = { 20 }
                    src = { IconCloseSolid } />
            </div>
        );
    }

    /**
     * Returns a React Element showing the Chat and Polls tab.
     *
     * @private
     * @returns {ReactElement}
     */
    function renderTabs() {
        if (!_isPollsEnabled && !_isSTTEnabled) {
            return null;
        }


        const tabs = [{
            accessibilityLabel: t('chat.tabs.chat'),
            countBadge: _nbUnreadMessages > 0 ? _nbUnreadMessages : undefined,
            id: CHAT_TABS.CHAT,
            controlsId: `${CHAT_TABS.CHAT}-panel`,
            label: t('chat.tabs.chat')
        }];
        
        if (_isSTTEnabled) {
            tabs.push({
                accessibilityLabel: t('chat.tabs.stt'),
                id: CHAT_TABS.STT,
                controlsId: `${CHAT_TABS.STT}-panel`,
                label: t('chat.tabs.stt')
            })
        }

        tabs.push({
            accessibilityLabel: t('chat.tabs.polls'),
            countBadge: _nbUnreadPolls > 0 ? _nbUnreadPolls : undefined,
            id: CHAT_TABS.POLLS,
            controlsId: `${CHAT_TABS.POLLS}-panel`,
            label: t('chat.tabs.polls')
        })
    
        return (
            <Tabs
                accessibilityLabel = { t(_isPollsEnabled ? 'chat.titleWithPolls' : 'chat.title') }
                onChange = { onChangeTab }
                selected = { _tabFocused }
                tabs = { tabs } />
        );
    }

    const updateChatSearchInput = value => {
        setSearchQuery(value);
        clearHighlightText();
        resetSearchResultIndex();
    }

    const handleChatSearchInput = () => {

        // clear highlights for pre-existing search term
        clearHighlightText();

        // call the function for highlighting search text
        highlightTextinUserMessages(searchQuery);

    }

    const clearHighlightText = () => {
        // logic to clear highlighted text
        var highlightedTexts = document.querySelectorAll("[class^='markjs-highlight']")
        highlightedTexts.forEach((el) => {
            el.replaceWith(document.createTextNode(el.textContent))
        })

        // reconstruct original chat messages
        // when we used cleared highlight texts above, the conent was replaced with broken strings
        // so we unified again with original text
        var usrmsgs = document.getElementsByClassName('usermessage');
        if (usrmsgs.length > 0) {
            for (let usrmsg of usrmsgs) {
                usrmsg.textContent = usrmsg.innerText;
            }
        }

    }

    // function that highlights a search term from the chat input box
    const highlightTextinUserMessages = (term) => {

        // define a context for the messages to be highlighted
        // we are only concerned with the div tags of className=usermessage, so we only search those
        let context = document.querySelectorAll("div.usermessage");

        // create a Mark object instance for the selected context
        let instance = new Mark(context);

        if (!term) {
            console.log("Search term is empty");
        }

        // convert all search terms to lowerCase to faciliate, case insensitive search
        term = term.toLowerCase();

        // uses the mark.js library to mark 'term' for all contexts defined
        // refer to the documentation in markjs.io for details
        instance.mark(term, {
            "caseSensitive": false, // whether or not to do case sensitive marking
            "separateWordSearch": false, // whether or not to treat the search term as consisting of different words when there is a space between words
            "className": "markjs-highlight", // the classname we would like to attach to <mark> tags for the highlighted or marked image
        });
    }

    // function that counts the search query (which has been highlighted) found in the chat window
    const countSearchOccurences = async () => {
        // we use the logic of counting html tags with the className "markjs-highlight" (created while highlighting search messages)
        // to count the total occurences of highlights
        const markTags = document.getElementsByClassName("markjs-highlight");
        let count = 0;

        for (let i = 0; i < markTags.length; i++) {
            // convert the textContent as well as search query to lowerCase, so that we get case insensitive search results
            if (markTags[i].textContent.toLowerCase() === searchQuery.toLowerCase()) {
                count += 1;
            }
        }

        // set the state for result count
        setSearchResultCount(count);

        // if there is no search results found (i.e. no highlighted text i.e. count = 0), then notify a toast message showing no results found
        if (count === 0) {
            await showToast({
                title: t('notify.noSearchResultsFound'),
                timeout: NOTIFICATION_TIMEOUT.SHORT,
                icon: 'info',
                animation: false
            });
        }
    };

    const resetSearchResultIndex = () => {
        setSearchResultIndex(-1);
        setCurrentIdx(-1);

        // removed event listener for nextResult on key press escape
        document.removeEventListener('keyup', nextResult);
    }

    // function to navigate to the next result in the chat window when there are multiple occurences of search results
    const nextResult = ev => {
        // get highlighted elements
        const markTags = document.getElementsByClassName("markjs-highlight");

        let currentIdx = searchResultIndex + 1;
        let resultIndex = currentIdx;

        if (searchResultCount > 0 && ev.key === "Enter") {

            // to keep in the loop
            if (currentIdx >= searchResultCount) {

                currentIdx = -1;
                resultIndex = currentIdx;

                // dispatch a notification pop-up when reaching end of search results
                showToast({
                    title: t('notify.endOfSearchResults'),
                    timeout: NOTIFICATION_TIMEOUT.SHORT,
                    icon: 'info',
                    animation: false
                });
            }

            // code to scroll into highlighted text area
            markTags[currentIdx] && markTags[currentIdx].scrollIntoView({ behavior: 'smooth' });

            // add additional highlighting style to identify the current item
            markTags[currentIdx] && markTags[currentIdx].style.setProperty('background', '#ec9038', '')
        }

        setCurrentIdx(currentIdx);
        setSearchResultIndex(resultIndex);
    };

    /**
     * Scrolls the chat messages so the latest message is visible.
     *
     * @param {boolean} withAnimation - Whether or not to show a scrolling
     * animation.
     * @private
     * @returns {void}
     */
    // const scrollMessageContainerToBottom = (withAnimation) => {
    //     messageContainerRef.current?.scrollToBottom(withAnimation);
    // }

    // const scrollSTTMessageContainerToBottom = (withAnimation) => {
    //     STTmessageContainerRef.current?.scrollToBottom(withAnimation);
    // }

    return (
        _isOpen ? <div
            className = { classes.container }
            id = 'sideToolbarContainer'
            onKeyDown = { onEscClick } >
            <ChatHeader
                className = { cx('chat-header', classes.chatHeader) }
                isPollsEnabled = { _isPollsEnabled }
                renderSearch = { renderSearch }
                onCancel = { onToggleChat }
                onToggleSearch = { onToggleSearch }
                showSearch = { showSearch } />
            {_showNamePrompt
                ? <DisplayNameForm isPollsEnabled = { _isPollsEnabled } />
                : renderChat()}
        </div> : null
    );
};

/**
 * Maps (parts of) the redux state to {@link Chat} React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @param {any} _ownProps - Components' own props.
 * @private
 * @returns {{
 *     _isModal: boolean,
 *     _isOpen: boolean,
 *     _isPollsEnabled: boolean,
 *     _isSTTEnabled: boolean,
 *     _messages: Array<Object>,
 *     _nbUnreadMessages: number,
 *     _nbUnreadPolls: number,
 *     _showNamePrompt: boolean,
 *     _tabFocused: string
 * }}
 */
function _mapStateToProps(state, _ownProps) {
    const {
        fileName,
        fileSize,
        fileUploadPercentage, 
        isOpen,
        messages,
        nbUnreadMessages,
        tabFocused,
        uploading,
    } = state['features/chat'];
    const { nbUnreadPolls } = state['features/polls'];
    const _localParticipant = getLocalParticipant(state);
    const chatModerationEnabled = isEnabledFromState('chat', state);
    const { use_file_chat, use_stt } = state['features/base/conference'].site;
    const { _sttHistory } = state['features/stt'];
    const fileUploadInProgress = Boolean(fileName !== undefined
        && fileUploadPercentage > 0
        && fileUploadPercentage < 100);

    return {
        _fileName: fileName,
        _fileSize: fileSize,
        _fileUploadInProgress: fileUploadInProgress,
        _fileUploadPercentage: fileUploadPercentage,
        _isFileDownloadEnabled: Boolean(use_file_chat),
        _isUploading: Boolean(uploading),
        _isModal: window.innerWidth <= SMALL_WIDTH_THRESHOLD,
        _isOpen: isOpen,
        _isPollsEnabled: !arePollsDisabled(state),
        _isSTTEnabled: Boolean(use_stt),
        _messages: messages,
        _STTmessages: _sttHistory,
        _showChatInput: !chatModerationEnabled || _localParticipant?.role === PARTICIPANT_ROLE.MODERATOR,
        _nbUnreadMessages: nbUnreadMessages,
        _nbUnreadPolls: nbUnreadPolls,
        _showNamePrompt: !_localParticipant?.name,
        _tabFocused: tabFocused,
    };
}

export default translate(connect(_mapStateToProps)(Chat));
