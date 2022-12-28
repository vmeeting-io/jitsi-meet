// @flow

import clsx from 'clsx';
import React from 'react';

import { FieldTextStateless as TextField } from '@atlaskit/field-text';
import CrossCircleIcon from '@atlaskit/icon/glyph/cross-circle';
import { uploadFile } from '../../functions';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { PollsPane } from '../../../polls/components';
import { toggleChat } from '../../actions.web';
import AbstractChat, {
    _mapStateToProps,
    type Props
} from '../AbstractChat';

import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import DisplayNameForm from './DisplayNameForm';
import KeyboardAvoider from './KeyboardAvoider';
import MessageContainer from './MessageContainer';
import MessageRecipient from './MessageRecipient';

import { setPrivateMessageRecipient } from '../../actions';
import { NOTIFICATION_TIMEOUT, showToast } from '../../../notifications';

import Mark from 'mark.js';
import DragAndDrop from './DragAndDrop';
import TouchmoveHack from './TouchmoveHack';

import STTMessageContainer from '../../../speech-to-text/components/stt-pane/STTMessageContainer';

declare var APP: Object;

/**
 * React Component for holding the chat feature in a side panel that slides in
 * and out of view.
 */

class Chat extends AbstractChat<Props> {

    /**
     * Reference to the React Component for displaying chat messages. Used for
     * scrolling to the end of the chat messages.
     */
    _messageContainerRef: Object;

    state = {
        chatHeaderMenuDialogOpen: false,
        showChatInput: true,
        searchQuery: '',
        showSearch: false,
        showChatMenu: false,
        searchResultIndex: -1, // initial value to assign while searching a value;
        searchResultCount: 0, //how many results found for a search query
        currentIdx: -1,
    };

    /**
     * Initializes a new {@code Chat} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._messageContainerRef = React.createRef();
        this._STTmessageContainerRef = React.createRef();

        // Bind event handlers so they are only bound once for every instance.
        this._onChatTabKeyDown = this._onChatTabKeyDown.bind(this);
        this._onChatInputResize = this._onChatInputResize.bind(this);
        this._onEscClick = this._onEscClick.bind(this);
        this._onPollsTabKeyDown = this._onPollsTabKeyDown.bind(this);
        this._onSTTTabKeyDown = this._onSTTTabKeyDown.bind(this);
        this._onToggleChat = this._onToggleChat.bind(this);

        this._onToggleSearch = this._onToggleSearch.bind(this);
        this._handleKeyPress = this._handleKeyPress.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._nextResult = this._nextResult.bind(this);
        this._updateChatSearchInput = this._updateChatSearchInput.bind(this);
        this._renderSearch = this._renderSearch.bind(this);
    }

    /**
     * Implements {@code Component#componentDidMount}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._scrollMessageContainerToBottom(true);
        this._scrollSTTMessageContainerToBottom(true);
        document.addEventListener('keypress', this._handleKeyPress);
        document.addEventListener('keydown', this._handleKeyDown);
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps) {
        if (this.props._messages !== prevProps._messages) {
            this._scrollMessageContainerToBottom(true);
        } else if (this.props._STTmessages !== prevProps._STTmessages) {
            this._scrollSTTMessageContainerToBottom(true);
        } else if (this.props._isOpen && !prevProps._isOpen) {
            this._scrollMessageContainerToBottom(false);
            this._scrollSTTMessageContainerToBottom(false);
        }
    }

    componentWillUnmount() {
        document.removeEventListener('keypress', this._handleKeyPress);
        document.removeEventListener('keydown', this._handleKeyDown);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _isOpen, _isPollsEnabled, _showNamePrompt } = this.props;

        return (
            _isOpen ? <div
                className = 'sideToolbarContainer'
                id = 'sideToolbarContainer'
                onKeyDown = { this._onEscClick } >
                <ChatHeader
                    className = 'chat-header'
                    id = 'chat-header'
                    isPollsEnabled = { _isPollsEnabled }
                    renderSearch = { this._renderSearch }
                    onCancel = { this._onToggleChat }
                    onToggleSearch = { this._onToggleSearch }
                    showSearch = { this.state.showSearch } />
                { _showNamePrompt
                    ? <DisplayNameForm isPollsEnabled = { _isPollsEnabled } />
                    : this._renderChat() }
            </div> : null
        );
    }

    _onChatInputResize: () => void;

    /**
     * Callback invoked when {@code ChatInput} changes height. Preserves
     * displaying the latest message if it is scrolled to.
     *
     * @private
     * @returns {void}
     */
    _onChatInputResize() {
        this._messageContainerRef.current.maybeUpdateBottomScroll();
    }

    _onToggleSearch: () => void;

    /**
     * Callback invoked when search button clicked.
     *
     * @private
     * @returns {void}
     */
    _onToggleSearch() {
        const showSearch = !this.state.showSearch;

        if (showSearch) {
            this.setState({ showSearch });
        } else {
            this.setState({ showSearch, searchQuery: '' });
            this._clearHighlightText();
        }
    }

    _onChatTabKeyDown: (KeyboardEvent) => void;

    /**
     * Key press handler for the chat tab.
     *
     * @param {KeyboardEvent} event - The event.
     * @returns {void}
     */
    _onChatTabKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            this._onToggleChatTab();
        }
    }

    _onEscClick: (KeyboardEvent) => void;

    /**
     * Click handler for the chat sidenav.
     *
     * @param {KeyboardEvent} event - Esc key click to close the popup.
     * @returns {void}
     */
    _onEscClick(event) {
        if (event.key === 'Escape' && this.props._isOpen) {
            event.preventDefault();
            event.stopPropagation();
            this._onToggleChat();
        }
    }

    _onPollsTabKeyDown: (KeyboardEvent) => void;

    /**
     * Key press handler for the polls tab.
     *
     * @param {KeyboardEvent} event - The event.
     * @returns {void}
     */
    _onPollsTabKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            this._onTogglePollsTab();
        }
    }

    _onSTTTabKeyDown: (KeyboardEvent) => void;

    /**
     * Key press handler for the polls tab.
     *
     * @param {KeyboardEvent} event - The event.
     * @returns {void}
     */
    _onSTTTabKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            this._onToggleSTTTab();
        }
    }


    /**
     * Returns a React Element for showing chat messages and a form to send new
     * chat messages.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderChat() {
        const {
            _isFileDownloadEnabled,
            _isPollsEnabled,
            _isPollsTabFocused,
            _isSTTEnabled,
            _isSTTTabFocused,
            _showChatInput,
            _privateMessageRecipient,
            t
        } = this.props;
        let _showMessageRecipient = false;

        if ((_privateMessageRecipient !== undefined) && (_privateMessageRecipient !== 'Vmeeter') && (_privateMessageRecipient !== 'Fellow Jister')) {
            _showMessageRecipient = true;
        } else {
            // when the _showMessageRecipient is false, i.e. there is no private message recipient, 
            // then dispatch reseting of private messaging
            this.props.dispatch(setPrivateMessageRecipient());
        }

        if (_isPollsTabFocused) {
            return (
                <>
                    {_isPollsEnabled && this._renderTabs()}
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

        if (_isSTTTabFocused) {
            return (
                <>
                    { this._renderTabs() }
                    <div
                        area-labelledby = 'stt-tab'
                        id = 'stt-panel'
                        role = 'tabpanel'>
                    </div>
                    <TouchmoveHack isModal = { this.props._isModal }>
                        <STTMessageContainer
                            messages = { this.props._STTmessages }
                            ref = { this._STTmessageContainerRef } />
                    </TouchmoveHack>
                    <KeyboardAvoider />
                </>
            );
        }

        return (
            <>
                {_isPollsEnabled && this._renderTabs()}
                <DragAndDrop
                    disabled = { !_isFileDownloadEnabled }
                    dropString = { t('chat.dropFiles') }
                    handleDrop = { this._fileDropHandler }>
                    <TouchmoveHack isModal = { this.props._isModal }>
                        <MessageContainer
                            fileUploadPercentage = { this.props._fileUploadPercentage }
                            fileName = { this.props._fileName }
                            fileSize = { this.props._fileSize }
                            isUploading = { this.props._isUploading }
                            messages = { this.props._messages }
                            ref = { this._messageContainerRef } />
                    </TouchmoveHack>
                    <MessageRecipient />
                    {_showChatInput && (
                        <>
                            <ChatInput
                                onResize = { this._onChatInputResize }
                                onSend = { this._onSendMessage } />
                            <KeyboardAvoider />
                        </>
                    )}
                </DragAndDrop>
            </>
        );
    }

    _fileDropHandler(file) {
        const state = APP.store.getState();

        // code block that identifies whether or not there is a file upload, currently in progress or not
        // if so upload is not processed.
        const existingFileName = state['features/chat'].fileName || undefined;
        const existingFileUploadP = state['features/chat'].fileUploadPercentage;
        let fileUploadInProgress = false;
        if ((existingFileName !== undefined) && (existingFileUploadP > 0 && existingFileUploadP < 100)) {
            fileUploadInProgress = true;
        }

        uploadFile(file, APP.store, fileUploadInProgress);
    }

    toggleChatHeaderMenuDialog = () => {
        this.setState({ chatHeaderMenuDialogOpen: !this.state.chatHeaderMenuDialogOpen });
    }

    _renderSearch() {
        const { t } = this.props;

        return (
            <div className='search-container'>
                <TextField
                    compact={true}
                    id='chatHeaderSearchBox'
                    autoFocus
                    placeholder={t('chat.search')}
                    shouldFitContainer={true}
                    isLabelHidden={true}
                    // eslint-disable-next-line react/jsx-no-bind
                    onChange={this._updateChatSearchInput}
                    type='text' />
                <div
                    className='close-icon'
                    onClick={this._onToggleSearch}>
                    <CrossCircleIcon size='small' />
                </div>
            </div>
        );
    }

    /**
     * Returns a React Element showing the Chat and Polls tab.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderTabs() {
        const { _isPollsEnabled, _isPollsTabFocused, _isSTTEnabled, _isSTTTabFocused, _nbUnreadMessages, _nbUnreadPolls, t } = this.props;

        return (
            <div
                aria-label = { t(_isPollsEnabled ? 'chat.titleWithPolls' : 'chat.title') }
                className = { 'chat-tabs-container' }
                role = 'tablist'>
                <div
                    aria-controls = 'chat-panel'
                    aria-label = { t('chat.tabs.chat') }
                    aria-selected = { !_isPollsTabFocused }
                    className = { `chat-tab ${
                        _isPollsTabFocused || _isSTTTabFocused ? '' : 'chat-tab-focus'
                    }` }
                    id = 'chat-tab'
                    onClick = { this._onToggleChatTab }
                    onKeyDown = { this._onChatTabKeyDown }
                    role = 'tab'
                    tabIndex = '0'>
                    <span
                        className = { 'chat-tab-title' }>
                        {t('chat.tabs.chat')}
                    </span>
                    {this.props._isPollsTabFocused
                        && _nbUnreadMessages > 0 && (
                        <span className = { 'chat-tab-badge' }>
                            {_nbUnreadMessages}
                        </span>
                    )}
                </div>
                <div
                    aria-controls = 'stt-panel'
                    aria-label = {t('chat.tabs.stt')}
                    aria-selected = { _isSTTTabFocused }
                    className = { `chat-tab ${
                        _isSTTTabFocused ? 'chat-tab-focus' : ''
                    }` }
                    id = 'stt-tab'
                    onClick = { this._onToggleSTTTab }
                    onKeyDown = { this._onSTTTabKeyDown }
                    role = 'tab'
                    tabIndex = '0'>
                    <span className = { 'chat-tab-title' }>
                        {t('chat.tabs.stt')}
                    </span>
                </div>
                <div
                    aria-controls = 'polls-panel'
                    aria-label = { t('chat.tabs.polls') }
                    aria-selected = { _isPollsTabFocused }
                    className = { `chat-tab ${
                        _isPollsTabFocused ? 'chat-tab-focus' : ''
                    }` }
                    id = 'polls-tab'
                    onClick = { this._onTogglePollsTab }
                    onKeyDown = { this._onPollsTabKeyDown }
                    role = 'tab'
                    tabIndex = '0'>
                    <span className = { 'chat-tab-title' }>
                        {t('chat.tabs.polls')}
                    </span>
                    {!_isPollsTabFocused
                        && this.props._nbUnreadPolls > 0 && (
                        <span className = { 'chat-tab-badge' }>
                            {_nbUnreadPolls}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    _updateChatSearchInput = event => {
        this.setState(
            { searchQuery: event.target.value },
            () => {
                // invoke the function that scrolls to chatMessage and highlights it
                this._clearHighlightText();
                this.resetSearchResultIndex();
            }
        );
    }

    _handleKeyPress = ev => {
        if (!this.state.showSearch) return;

        if (ev.key === "Enter") {
            this._handleChatSearchInput();

            // count the occurences of search query
            this.countSearchOccurences();
            this._nextResult(ev);
        }
    }

    _handleKeyDown = ev => {
        if (this.state.showSearch && ev.key === 'Escape') {
            this._onToggleSearch();
            this.resetSearchResultIndex();
        }
    }

    _handleChatSearchInput = () => {

        // clear highlights for pre-existing search term
        this._clearHighlightText();

        // call the function for highlighting search text
        this.highlightTextinUserMessages(this.state.searchQuery);

    }

    _clearHighlightText = () => {
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
    highlightTextinUserMessages = (term) => {

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
    countSearchOccurences = async () => {
        // we use the logic of counting html tags with the className "markjs-highlight" (created while highlighting search messages)
        // to count the total occurences of highlights
        const { t } = this.props;
        const markTags = document.getElementsByClassName("markjs-highlight");
        let count = 0;

        for (let i = 0; i < markTags.length; i++) {
            // convert the textContent as well as search query to lowerCase, so that we get case insensitive search results
            if (markTags[i].textContent.toLowerCase() === this.state.searchQuery.toLowerCase()) {
                count += 1;
            }
        }

        // set the state for result count
        this.setState({ searchResultCount: count });

        // if there is no search results found (i.e. no highlighted text i.e. count = 0), then notify a toast message showing no results found
        if (count === 0) {
            await showToast({
                title: t('notify.noSearchResultsFound'),
                timeout: NOTIFICATION_TIMEOUT.SHORT,
                icon: 'info',
                animation: false
            });
        }

    }

    resetSearchResultIndex = () => {
        this.setState({
            searchResultIndex: -1,
            currentIdx: -1,
        });

        // removed event listener for nextResult on key press escape
        document.removeEventListener('keyup', this._nextResult);
    }

    // function to navigate to the next result in the chat window when there are multiple occurences of search results
    _nextResult = ev => {
        const { t } = this.props;
        const { searchResultCount, searchResultIndex } = this.state;
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

        this.setState({ currentIdx, searchResultIndex: resultIndex });
    }

    /**
     * Scrolls the chat messages so the latest message is visible.
     *
     * @param {boolean} withAnimation - Whether or not to show a scrolling
     * animation.
     * @private
     * @returns {void}
     */
    _scrollMessageContainerToBottom(withAnimation) {
        if (this._messageContainerRef.current) {
            this._messageContainerRef.current.scrollToBottom(withAnimation);
        }
    }

    _scrollSTTMessageContainerToBottom(withAnimation) {
        if (this._STTmessageContainerRef.current) {
            this._STTmessageContainerRef.current.scrollToBottom(withAnimation);
        }
    }


    _onSendMessage: (string) => void;

    _onToggleChat: () => void;

    /**
    * Toggles the chat window.
    *
    * @returns {Function}
    */
    _onToggleChat() {
        this.props.dispatch(toggleChat());
    }
    _onTogglePollsTab: () => void;
    _onToggleSTTTab: () => void;
    _onToggleChatTab: () => void;

}

export default translate(connect(_mapStateToProps)(Chat));
