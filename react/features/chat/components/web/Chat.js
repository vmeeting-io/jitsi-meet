// @flow

import React from 'react';

import { FieldTextStateless as TextField } from '@atlaskit/field-text';
import CrossCircleIcon from '@atlaskit/icon/glyph/cross-circle';
import DropdownMenu, { DropdownItem, DropdownItemGroup } from '@atlaskit/dropdown-menu';

import { translate } from '../../../base/i18n';
import { Icon, IconClose, IconMenu, IconMenuThumb, IconSearch } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { Tooltip } from '../../../base/tooltip';
import { PollsPane } from '../../../polls/components';
import { toggleChat } from '../../actions.web';
import AbstractChat, {
    _mapStateToProps,
    type Props
} from '../AbstractChat';

import ChatDialog from './ChatDialog';
import Header from './ChatDialogHeader';
import ChatInput from './ChatInput';
import DisplayNameForm from './DisplayNameForm';
import KeyboardAvoider from './KeyboardAvoider';
import MessageContainer from './MessageContainer';
import MessageRecipient from './MessageRecipient';
import InlineDialog from '@atlaskit/inline-dialog/dist/cjs/InlineDialog';
import { getLocalParticipant } from '../../../base/participants';
import ChatDisableButtonForAll from './ChatDisableButtonForAll';

import s from './Chat.module.scss';
import { openDialog } from '../../../base/dialog';
import EnableChatForAllParticipantsDialog from '../../../video-menu/components/web/EnableChatForAllParticipantsDialog';
import DisableChatForAllParticipantsDialog from '../../../video-menu/components/web/DisableChatForAllParticipantsDialog';

import { showToast } from '../../../notifications';

import Mark from 'mark.js';

declare var APP: Object;

/**
 * React Component for holding the chat feature in a side panel that slides in
 * and out of view.
 */

/**
 * The type of the React {@code Component} state of {@link Chat}.
 */
 type State = {
    chatHeaderMenuDialogOpen: boolean,
    showChatInput: Boolean,
    searchQuery: String,
    showSearch: Boolean,
    showChatMenu: Boolean,
    searchResultIndex: Integer,
    searchResultCount: Integer,
    currentIdx: Integer,
}

const NOTIFICATION_TIMEOUT = 1000;

class Chat extends AbstractChat<Props> {

    /**
     * Whether or not the {@code Chat} component is off-screen, having finished
     * its hiding animation.
     */
    _isExited: boolean;

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

        this._isExited = true;
        this._messageContainerRef = React.createRef();

        // Bind event handlers so they are only bound once for every instance.
        this._renderPanelContent = this._renderPanelContent.bind(this);
        this._onChatInputResize = this._onChatInputResize.bind(this);
        this._onEscClick = this._onEscClick.bind(this);
        this._onToggleChat = this._onToggleChat.bind(this);

        this._onToggleSearch = this._onToggleSearch.bind(this);
        this._onDisableChatForAll = this._onDisableChatForAll.bind(this);
        this._onEnableChatForAll = this._onEnableChatForAll.bind(this);
        this._handleKeyPress = this._handleKeyPress.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._nextResult = this._nextResult.bind(this);
        this._updateChatSearchInput = this._updateChatSearchInput.bind(this);
    }

    /**
     * Implements {@code Component#componentDidMount}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._scrollMessageContainerToBottom(true);
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
        } else if (this.props._isOpen && !prevProps._isOpen) {
            this._scrollMessageContainerToBottom(false);
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
        return (
            <>
                { this._renderPanelContent() }
            </>
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

    _onDisableChatForAll: () => void;

    _onDisableChatForAll() {
        APP.store.dispatch(openDialog(DisableChatForAllParticipantsDialog));
    }

    _onEnableChatForAll: () => void;

    _onEnableChatForAll() {
        APP.store.dispatch(openDialog(EnableChatForAllParticipantsDialog));
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

    /**
     * Returns a React Element for showing chat messages and a form to send new
     * chat messages.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderChat() {
        const { _showChatInput } = this.props;

        if (this.props._isPollsTabFocused) {
            return (
                <>
                    { this.props._isPollsEnabled && this._renderTabs()}
                    <PollsPane />
                    <KeyboardAvoider />
                </>
            );
        }

        return (
            <>
                {this.props._isPollsEnabled && this._renderTabs()}
                <TouchmoveHack isModal = { this.props._isModal }>
                    <MessageContainer
                        messages = { this.props._messages }
                        ref = { this._messageContainerRef } />
                    </TouchmoveHack>
                <MessageRecipient />
                { _showChatInput && (
                    <>
                        <ChatInput
                            onResize = { this._onChatInputResize }
                            onSend = { this._onSendMessage } />
                        <KeyboardAvoider />
                    </>
                )}
            </>
        );
    }

    toggleChatHeaderMenuDialog = () => {
        this.setState({ chatHeaderMenuDialogOpen: !this.state.chatHeaderMenuDialogOpen });
    }

    _renderSearch() {
        const { t } = this.props;

        return (
            <div className = { s.searchContainer }>
                <TextField
                    compact = { true }
                    id = 'chatHeaderSearchBox'
                    autoFocus
                    placeholder =  { t('chat.search') }
                    shouldFitContainer = { true }
                    isLabelHidden = { true }
                    // eslint-disable-next-line react/jsx-no-bind
                    onChange = { this._updateChatSearchInput }
                    type = 'text' />
                <div
                    className = { s.closeIcon }
                    onClick = { this._onToggleSearch }>
                    <CrossCircleIcon size = 'small' />
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

        return (
            <div className = { 'chat-tabs-container' }>
                <div
                    className = { `chat-tab ${
                        this.props._isPollsTabFocused ? '' : 'chat-tab-focus'
                    }` }
                    onClick = { this._onToggleChatTab }>
                    <span className = { 'chat-tab-title' }>
                        {this.props.t('chat.tabs.chat')}
                    </span>
                    {this.props._isPollsTabFocused
                        && this.props._nbUnreadMessages > 0 && (
                        <span className = { 'chat-tab-badge' }>
                            {this.props._nbUnreadMessages}
                        </span>
                    )}
                </div>
                <div
                    className = { `chat-tab ${
                        this.props._isPollsTabFocused ? 'chat-tab-focus' : ''
                    }` }
                    onClick = { this._onTogglePollsTab }>
                    <span className = { 'chat-tab-title' }>
                        {this.props.t('chat.tabs.polls')}
                    </span>
                    {!this.props._isPollsTabFocused
                        && this.props._nbUnreadPolls > 0 && (
                        <span className = { 'chat-tab-badge' }>
                            {this.props._nbUnreadPolls}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    /**
     * Instantiates a React Element to display at the top of {@code Chat} to
     * close {@code Chat}.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderChatHeader() {
        const { _enableChatControl, t } = this.props;
        const { showSearch } = this.state;
        const localParticipant = getLocalParticipant(APP.store.getState());
        const showMenu =
            _enableChatControl &&
            localParticipant.role === 'moderator';

        return (
            <div className = {`chat-header ${s.chatHeader}`}>
                { !showSearch ? t('chat.title') : this._renderSearch() }
                {/* Portion for rendering the chat close icon */}
                <div className = { s.toolContainer }>
                    { !showSearch && (
                        <div
                            className = { s.button }
                            onClick = { this._onToggleSearch }>
                            <Tooltip
                                content = { t('chat.search') }
                                position = 'bottom'>
                                <Icon src = { IconSearch } />
                            </Tooltip>
                        </div>
                    )}
                    { showMenu ? (
                        <DropdownMenu
                            position = 'bottom right'
                            triggerButtonProps = {{ iconBefore: <Icon src = { IconMenu } /> }}
                            triggerType = 'button'>
                            <DropdownItemGroup>
                                <DropdownItem onClick = { this._onDisableChatForAll }>
                                    { t('dialog.disableChatForAll') }
                                </DropdownItem>
                                <DropdownItem onClick = { this._onEnableChatForAll }>
                                    { t('dialog.enableChatForAll') }
                                </DropdownItem>
                                <DropdownItem onClick = { this._onToggleChat }>
                                    { t('dialog.close') }
                                </DropdownItem>
                            </DropdownItemGroup>
                        </DropdownMenu>
                    ) : (
                        <div
                            className = { s.button }
                            onClick = { this._onToggleChat }>
                            <Tooltip
                                content = { t('dialog.close') }
                                position = 'bottom'>
                                <Icon src = { IconClose } />
                            </Tooltip>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    _renderChatControlIcon = () => {
        const popupcontent = (
            <ul className='overflow-menu'>
                    <ChatDisableButtonForAll key = 'allchatcontroldisablebutton' visible = { true } showLabel = { true } /> 
            </ul>
        );

        const localParticipant = getLocalParticipant(APP.store.getState());  
        let isLocalParticipantAModerator = (localParticipant.role === "moderator");

        //we want to only allow moderators to get the chat control button alongside chat message
        if(isLocalParticipantAModerator) {
            return(
                <div className='chat-header-control-button'>
                    <InlineDialog 
                        onClose={() => { 
                            this.setState({chatHeaderMenuDialogOpen: false}); 
                        }}
                        content = { popupcontent }
                        placement = { 'auto' }
                        isOpen = { this.state.chatHeaderMenuDialogOpen } >
                            <div className='thumb-menu-icon' onClick = { this.toggleChatHeaderMenuDialog }>
                                <Icon src = { IconMenuThumb } title = 'All Remote-Users Chat Control' />
                            </div>
                    </InlineDialog>
                </div>  
            );
        } else {
            return null;
        }

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
        if(usrmsgs.length > 0) {
            for(let usrmsg of usrmsgs) {
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

        if(!term) {
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

        for(let i=0; i < markTags.length; i++) {
            // convert the textContent as well as search query to lowerCase, so that we get case insensitive search results
            if(markTags[i].textContent.toLowerCase() === this.state.searchQuery.toLowerCase()) {
                count += 1;
            }
        }

        // set the state for result count
        this.setState({ searchResultCount: count });

        // if there is no search results found (i.e. no highlighted text i.e. count = 0), then notify a toast message showing no results found
        if(count === 0) {
            await showToast({
                title: t('notify.noSearchResultsFound'),
                timeout: NOTIFICATION_TIMEOUT,
                icon: 'info',
                animation: false });
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
                
                currentIdx =  -1;
                resultIndex = currentIdx;

                // dispatch a notification pop-up when reaching end of search results
                showToast({
                    title: t('notify.endOfSearchResults'),
                    timeout: NOTIFICATION_TIMEOUT,
                    icon: 'info',
                    animation: false });
            }

            // code to scroll into highlighted text area
            markTags[currentIdx] && markTags[currentIdx].scrollIntoView({ behavior: 'smooth' });
            
            // add additional highlighting style to identify the current item
            markTags[currentIdx] && markTags[currentIdx].style.setProperty('background','#ec9038','')
        }

        this.setState({ currentIdx, searchResultIndex: resultIndex });
    }

    _renderPanelContent: () => React$Node | null;

    /**
     * Renders the contents of the chat panel.
     *
     * @private
     * @returns {ReactElement | null}
     */
    _renderPanelContent() {
        const { _isModal, _isOpen, _showNamePrompt } = this.props;
        let ComponentToRender = null;

        if (_isOpen) {
            if (_isModal) {
                ComponentToRender = (
                    <ChatDialog>
                        { _showNamePrompt ? <DisplayNameForm /> : this._renderChat() }
                    </ChatDialog>
                );
            } else {
                ComponentToRender = (
                    <>
                        { this._renderChatHeader() }
                        { _showNamePrompt ? <DisplayNameForm /> : this._renderChat() }
                    </>
                );
            }
        }
        let className = '';

        if (_isOpen) {
            className = 'slideInExt';
        } else if (this._isExited) {
            className = 'invisible';
        }

        return (
            <div
                aria-haspopup = 'true'
                className = { `sideToolbarContainer ${className}` }
                id = 'sideToolbarContainer'
                onKeyDown = { this._onEscClick } >
                { ComponentToRender }
            </div>
        );
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
    _onToggleChatTab: () => void;

}

export default translate(connect(_mapStateToProps)(Chat));
