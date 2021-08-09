// @flow

import { FieldTextStateless as TextField } from '@atlaskit/field-text';
import {
    HeaderComponentProps,
    ModalHeader
} from '@atlaskit/modal-dialog';
import Spinner from '@atlaskit/spinner';
import { filter, keyBy, map } from 'lodash';
import React, { Component } from 'react';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { Tooltip } from '../../base/tooltip';
import { loadSpeakerStats } from '../actions';

import SpeakerStatsItem from './SpeakerStatsItem';
import SpeakerStatsLabels from './SpeakerStatsLabels';

import s from './SpeakerStats.module.scss';
import { MEDIA_TYPE, VIDEO_TYPE } from '../../base/media';
import { getLocalVideoTrack, getTrackByMediaTypeAndParticipant, isLocalTrackMuted, isLocalCameraTrackMuted, isRemoteTrackMuted } from '../../base/tracks';
import { getParticipantById, PARTICIPANT_ROLE } from '../../base/participants';
import { Icon, IconSearch } from '../../base/icons';
import CrossCircleIcon from '@atlaskit/icon/glyph/cross-circle';

/**
 * The type of the React {@code Component} props of {@link SpeakerStats}.
 */
type Props = {

    /**
     * The JitsiConference from which stats will be pulled.
     */
    conference: Object,

    /**
     * The function to translate human-readable text.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link SpeakerStats}.
 */
type State = {

    loading: Boolean,

    /**
     * The search query inserted by the user
     */
    searchQuery: String,

    /**
     * An array of items object containing search results to be returned
     */
    searchResult: Array
};

/**
 * React component for displaying a list of speaker stats.
 *
 * @extends Component
 */
class SpeakerStats extends Component<Props, State> {
    /**
     * Initializes a new SpeakerStats instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            searchQuery: '',
            searchResult: [], //initialize the initialy state variable as an empty array
            showSearch: false,
        };

        this._onRefresh = this._onRefresh.bind(this);
        this._onToggleSearch = this._onToggleSearch.bind(this);
        this._customHeader = this._customHeader.bind(this);
        this.filterParticipants = this.filterParticipants.bind(this);
        this.handleSearchInput = this.handleSearchInput.bind(this);
    }

    /**
     * Begin polling for speaker stats updates.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._onRefresh();
    }

    /**
     * Stop polling for speaker stats updates.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
    }

    _onRefresh: () => void;

    /**
     * Refresh a recent entry.
     *
     * @inheritdoc
     * @returns {void}
     */
    _onRefresh() {
        const { conference, dispatch } = this.props;
        
        this.setState({ loading: true });
        dispatch(loadSpeakerStats(conference.room.meetingId)).then(() => {
            this.setState({ loading: false });
        });
    }

    _onToggleSearch: () => void;

    /**
     * Toggle a search input.
     *
     * @inheritdoc
     * @returns {void}
     */
    _onToggleSearch() {
        const showSearch = !this.state.showSearch;

        if (showSearch) {
            this.setState({ showSearch });
        } else {
            this.setState({ showSearch, searchQuery: '' });
        }
    }

    _customHeader = (props: HeaderComponentProps) => {
        const { t } = this.props;
        const { loading, showSearch } = this.state;

        return (
            <ModalHeader {...props}>
                <h4 className={ s.titleContainer }>
                    <span>
                        { t('speakerStats.speakerStats') }
                    </span>
                    { !loading && (
                        <div
                            className = { `${s.button} ${showSearch ? s.pressed : ''}` }
                            onClick = { this._onToggleSearch }>
                            <Tooltip content = { t('speakerStats.search') } position = 'top'>
                                <Icon size = { 24 } src = { IconSearch } />
                            </Tooltip>
                        </div>
                    )}
                </h4>
            </ModalHeader>
        );
    };

    /**
     * Function to handle search inputs
     * @param {Object} event from search input box
     */
    handleSearchInput = event => {
        this.setState(
            { searchQuery: event.target.value },
            () => this.filterParticipants(this.state.searchQuery)
        );
    }

    /**
     * Core function that filters participants based on the search input
     * @param {String} filterText the string from search input, based upon which to filter result
     */
    filterParticipants = filterText => {
        const { stats } = this.props;
        filterText = filterText.toLowerCase();
        this.setState({
            searchResult: filter(stats, ({ name }) =>
                name && name.toLowerCase().includes(filterText)
            )
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { searchQuery, searchResult } = this.state;
        const { stats } = this.props;
        let items = [];

        if (searchQuery) {
            items = map(searchResult, item => (
                <SpeakerStatsItem
                    hasLeft = { Boolean(item.leaveTime) }
                    key = { item.nick }
                    { ...item } />
            ));
        } else {
            //first created items, when there has been no search text or search result
            items = map(stats, item => (
                <SpeakerStatsItem
                    hasLeft = { Boolean(item.leaveTime) }
                    key = { item.nick }
                    { ...item } />
            ));
        }

        return (
            <Dialog
                cancelKey = { 'dialog.close' }
                customHeader = { this._customHeader }
                submitDisabled = { true }
                width = { 'large' }
                titleKey = 'speakerStats.speakerStats'>
                
                { this.state.showSearch && (
                    <div className = {`speaker-stats-searchbox ${s.searchContainer}`}>
                        <TextField
                            autoFocus = { true }
                            compact = { true }
                            id = 'searchBox'
                            placeholder =  { this.props.t('speakerStats.searchPlaceholder') }
                            shouldFitContainer = { true }
                            isLabelHidden = { true }
                            // eslint-disable-next-line react/jsx-no-bind
                            onChange = { this.handleSearchInput }
                            type = 'text'
                            value = { this.state.searchQuery } />
                        <div
                            className = { s.closeIcon }
                            onClick = { this._onToggleSearch }>
                            <CrossCircleIcon size = 'small' />
                        </div>
                    </div>
                )}

                <hr className = { s.divider } />

                <div className = { `speaker-stats ${s.container}` }>
                    <SpeakerStatsLabels />
                    { this.state.loading
                        ? <Spinner appearance = 'invert' />
                        : items }
                </div>
            </Dialog>
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated SpeakerStats's props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns Object
 */
function _mapStateToProps(state) {
    const tracks = state['features/base/tracks'];
    const stats = state['features/speaker-stats'];

    return {
        stats: map(stats.items, item => {
            const p = getParticipantById(state, item.nick);

            if (p) {
                const videoTrack = p.local
                    ? getLocalVideoTrack(tracks)
                    : getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, item.nick);

                return {
                    ...item,
                    local: p.local,
                    audioMuted: p.local
                        ? isLocalTrackMuted(tracks, MEDIA_TYPE.AUDIO)
                        : isRemoteTrackMuted(tracks, MEDIA_TYPE.AUDIO, item.nick),
                    videoMuted: p.local
                        ? isLocalCameraTrackMuted(tracks)
                        : !videoTrack || videoTrack.muted,
                    isModerator: p.role === PARTICIPANT_ROLE.MODERATOR,
                    isPresenter: videoTrack?.videoType === VIDEO_TYPE.DESKTOP,
                    chat: p.role !== 'visitor'
                }
            }
            return item;
        })
    };
}

export default translate(connect(_mapStateToProps)(SpeakerStats));
