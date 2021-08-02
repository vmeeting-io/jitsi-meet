/* @flow */

import { filter, keyBy, map } from 'lodash';
import React, { Component } from 'react';
import type { Dispatch } from 'redux';

// import { getVideoId } from '../../../../../modules/UI/videolayout/VideoLayout';
import {
    createShortcutEvent,
    createToolbarEvent,
    sendAnalytics
} from '../../../analytics';
import { translate } from '../../../base/i18n';
import { Icon, IconMenuDown, IconMenuUp } from '../../../base/icons';
import AudioTrack from '../../../base/media/components/web/AudioTrack';
import { getLocalParticipant, getParticipants, moveParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { isButtonEnabled } from '../../../toolbox/functions.web';
import { getCurrentLayout, getCurrentPage, LAYOUTS } from '../../../video-layout';
import { setFilmstripVisible } from '../../actions';
import { shouldRemoteVideosBeVisible } from '../../functions';

import PagePrevButton from '../../../conference/components/PagePrevButton';
import PageNextButton from '../../../conference/components/PageNextButton';

import Thumbnail from './Thumbnail';

declare var APP: Object;
declare var interfaceConfig: Object;
declare var $: Object;

/**
 * The type of the React {@code Component} props of {@link Filmstrip}.
 */
type Props = {

    /**
     * Additional CSS class names top add to the root.
     */
    _className: string,

    /**
     * The current layout of the filmstrip.
     */
    _currentLayout: string,

    /**
     * The width of the filmstrip.
     */
    _filmstripWidth: number,

    /**
     * Whether the filmstrip scrollbar should be hidden or not.
     */
    _hideScrollbar: boolean,

    /**
     * Whether the filmstrip toolbar should be hidden or not.
     */
    _hideToolbar: boolean,

    /**
     * Whether the filmstrip button is enabled.
     */
    _isFilmstripButtonEnabled: boolean,

    /**
     * Additional CSS class names to add to the container of all the thumbnails.
     */
    _videosClassName: string,

    /**
     * Whether or not the filmstrip videos should currently be displayed.
     */
    _visible: boolean,

    /**
     * Whether or not the toolbox is displayed.
     */
    _isToolboxVisible: Boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Implements a React {@link Component} which represents the filmstrip on
 * Web/React.
 *
 * @extends Component
 */
class Filmstrip extends Component <Props> {

    /**
     * Initializes a new {@code Filmstrip} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onShortcutToggleFilmstrip = this._onShortcutToggleFilmstrip.bind(this);
        this._onToolbarToggleFilmstrip = this._onToolbarToggleFilmstrip.bind(this);
        this._videosContainer = React.createRef();
        this._renderAudioTrack = this._renderAudioTrack.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this.$videosContainer = $(this._videosContainer.current);
        APP.keyboardshortcut.registerShortcut(
            'F',
            'filmstripPopover',
            this._onShortcutToggleFilmstrip,
            'keyboardShortcuts.toggleFilmstrip'
        );
    }

    /**
     * Implements React's {@link Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        APP.keyboardshortcut.unregisterShortcut('F');
    }

    componentDidUpdate(prevProps: Props) {
        if (!this.props._disableSortable && (
            prevProps._currentLayout !== this.props._currentLayout ||
            prevProps._pagination !== this.props._pagination ||
            prevProps._currentPage !== this.props._currentPage
        )) {
            this._changeSortable();
        }
    }

    _changeSortable() {
        const { _currentLayout, _pagination, dispatch } = this.props;

        if (_currentLayout === LAYOUTS.TILE_VIEW) {
            this.$videosContainer.sortable({
                disabled: false,
                start: (evt, ui) => {
                    ui.item.data('index', ui.item.index());
                },
                stop: (evt, ui) => {
                    const { current, pageSize } = _pagination;
                    const pageStart = (current - 1) * pageSize;
                    const src = ui.item.data('index');
                    const dst = ui.item.index();
                    dispatch(moveParticipant(pageStart + src, pageStart + dst));
                }
            });
        } else {
            this.$videosContainer.sortable({
                disabled: true
            });
        }
    }

    _renderAudioTrack(track) {
        const { _startSilent } = this.props;
        const jitsiAudioTrack = track?.jitsiTrack;
        const audioTrackId = jitsiAudioTrack && jitsiAudioTrack.getId();

        return (
            <AudioTrack
                key = { audioTrackId }
                audioTrack = { track }
                id = { `remoteAudio_${audioTrackId || ''}` }
                muted = { _startSilent } />
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const filmstripStyle = { };
        const filmstripRemoteVideosContainerStyle = {};
        let remoteVideoContainerClassName = 'remote-videos-container';
        const { _audioTracks, _currentLayout, _currentPage, _localParticipantId, tileViewActive } = this.props;

        switch (_currentLayout) {
        case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
            // Adding 18px for the 2px margins, 2px borders on the left and right and 5px padding on the left and right.
            // Also adding 7px for the scrollbar.
            filmstripStyle.maxWidth = (interfaceConfig.FILM_STRIP_MAX_HEIGHT || 120) + 25;
            break;
        case LAYOUTS.TILE_VIEW: {
            // The size of the side margins for each tile as set in CSS.
            const { _filmstripWidth } = this.props;
            filmstripRemoteVideosContainerStyle.width = _filmstripWidth;
            break;
        }
        }

        let remoteVideosWrapperClassName = 'filmstrip__videos';

        if (this.props._hideScrollbar) {
            remoteVideosWrapperClassName += ' hide-scrollbar';
        }

        let toolbar = null;

        if (!this.props._hideToolbar && this.props._isFilmstripButtonEnabled) {
            toolbar = this._renderToggleButton();
        }

        return (
            <div
                className = { `filmstrip ${this.props._className}` }
                style = { filmstripStyle }>
                <div
                    className = { this.props._videosClassName }
                    id = 'remoteVideos'>
                    <div
                        className = 'filmstrip__videos'
                        id = 'filmstripLocalVideo'>
                        <div id = 'filmstripLocalVideoThumbnail'>
                            {
                                !tileViewActive && <Thumbnail
                                    key = 'local'
                                    participantID = { _localParticipantId } />
                            }
                        </div>
                    </div>
                    <PagePrevButton />
                    <div
                        className = { remoteVideosWrapperClassName }
                        id = 'filmstripRemoteVideos'>
                        {/*
                          * XXX This extra video container is needed for
                          * scrolling thumbnails in Firefox; otherwise, the flex
                          * thumbnails resize instead of causing overflow.
                          */}
                        <div
                            className = { remoteVideoContainerClassName }
                            id = 'filmstripRemoteVideosContainer'
                            ref={this._videosContainer}
                            style = { filmstripRemoteVideosContainerStyle }>
                            { _currentPage.map(id =>
                                <Thumbnail key = { id } participantID = { id } />
                            )}
                        </div>
                    </div>
                    <div className = 'remoteAudioTracks'>
                        { _audioTracks.map(this._renderAudioTrack) }
                    </div>
                    <PageNextButton />
                </div>
                { toolbar }
            </div>
        );
    }

    _onTabIn: () => void;

    /**
     * Toggle the toolbar visibility when tabbing into it.
     *
     * @returns {void}
     */
    _onTabIn() {
        if (!this.props._isToolboxVisible && this.props._visible) {
            this.props.dispatch(showToolbox());
        }
    }

    /**
     * Dispatches an action to change the visibility of the filmstrip.
     *
     * @private
     * @returns {void}
     */
    _doToggleFilmstrip() {
        this.props.dispatch(setFilmstripVisible(!this.props._visible));
    }

    _onShortcutToggleFilmstrip: () => void;

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling filmstrip visibility.
     *
     * @private
     * @returns {void}
     */
    _onShortcutToggleFilmstrip() {
        sendAnalytics(createShortcutEvent(
            'toggle.filmstrip',
            {
                enable: this.props._visible
            }));

        this._doToggleFilmstrip();
    }

    _onToolbarToggleFilmstrip: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for opening
     * the speaker stats modal.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleFilmstrip() {
        sendAnalytics(createToolbarEvent(
            'toggle.filmstrip.button',
            {
                enable: this.props._visible
            }));

        this._doToggleFilmstrip();
    }

    /**
     * Creates a React Element for changing the visibility of the filmstrip when
     * clicked.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderToggleButton() {
        const icon = this.props._visible ? IconMenuDown : IconMenuUp;
        const { _hideFilmstrip, t } = this.props;

        return !_hideFilmstrip && (
            <div className = 'filmstrip__toolbar'>
                <button
                    aria-expanded = { this.props._visible }
                    aria-label = { t('toolbar.accessibilityLabel.toggleFilmstrip') }
                    id = 'toggleFilmstripButton'
                    onClick = { this._onToolbarToggleFilmstrip }
                    onFocus = { this._onTabIn }
                    tabIndex = { 0 }>
                    <Icon
                        aria-label = { t('toolbar.accessibilityLabel.toggleFilmstrip') }
                        src = { icon } />
                </button>
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code Filmstrip}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const {
        iAmSipGateway,
        disableSortable,
        hideLocalVideo,
        hideRemoteVideos,
        startSilent,
    } = state['features/base/config'];
    const { visible } = state['features/filmstrip'];
    const remoteVideosVisible = shouldRemoteVideosBeVisible(state);
    const { isOpen: shiftRight } = state['features/chat'];
    const className = `${remoteVideosVisible ? '' : 'hide-videos'} ${shiftRight ? 'shift-right' : ''}`.trim();
    const videosClassName = `filmstrip__videos${visible ? '' : ' hidden'}`;
    const { filmstripWidth } = state['features/filmstrip'].tileViewDimensions;
    const _currentLayout = getCurrentLayout(state);
    const localParticipant = getLocalParticipant(state);
    const tileViewActive = _currentLayout === LAYOUTS.TILE_VIEW;
    const { pagination } = state['features/video-layout'];
    const currentPage = getCurrentPage(state);
    const participants = getParticipants(state);
    const pageMap = keyBy(currentPage, 'id');

    return {
        _audioTracks: map(filter(participants, p => !pageMap[p.id] && !p.local && p.audio && !p.audio.muted), 'audio'),
        _className: className,
        _currentLayout,
        _disableSortable: disableSortable,
        _filmstripWidth: filmstripWidth,
        _hideFilmstrip: Boolean(hideRemoteVideos && hideLocalVideo),
        _hideScrollbar: Boolean(iAmSipGateway),
        _hideToolbar: Boolean(iAmSipGateway),
        _isFilmstripButtonEnabled: isButtonEnabled('filmstrip', state),
        _localParticipantId: localParticipant?.id,
        _pagination: pagination,
        _currentPage: map(currentPage, 'id'),
        _startSilent: Boolean(startSilent),
        _videosClassName: videosClassName,
        _visible: visible,
        tileViewActive,
    };
}

export default translate(connect(_mapStateToProps)(Filmstrip));
