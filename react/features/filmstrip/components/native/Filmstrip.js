// @flow

import React, { Component } from 'react';
import { FlatList, SafeAreaView } from 'react-native';

import { Platform } from '../../../base/react';
import { connect } from '../../../base/redux';
import { getLocalParticipant } from '../../../base/participants';
import { ASPECT_RATIO_NARROW } from '../../../base/responsive-ui/constants';
import { setVisibleRemoteParticipants } from '../../actions.native';
import { SMALL_THUMBNAIL_SIZE } from '../../constants';
import { isFilmstripVisible, shouldRemoteVideosBeVisible } from '../../functions';

import LocalThumbnail from './LocalThumbnail';
import Thumbnail from './Thumbnail';
import styles from './styles';
import debounce from 'lodash.debounce';

// Immutable reference to avoid re-renders.
const NO_REMOTE_VIDEOS = [];

/**
 * Filmstrip component's property types.
 */
type Props = {

    /**
     * Application's aspect ratio.
     */
    _aspectRatio: Symbol,

    /**
     * The participants in the conference.
     */
    _participants: Array<any>,

    /**
     * The indicator which determines whether the filmstrip is visible.
     */
    _visible: boolean
};

/**
 * Implements a React {@link Component} which represents the filmstrip on
 * mobile/React Native.
 *
 * @extends Component
 */
class Filmstrip extends Component<Props> {
    /**
     * Whether the local participant should be rendered separately from the
     * remote participants i.e. outside of their {@link ScrollView}.
     */
    _separateLocalThumbnail: boolean;

    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        // XXX Our current design is to have the local participant separate from
        // the remote participants. Unfortunately, Android's Video
        // implementation cannot accommodate that because remote participants'
        // videos appear on top of the local participant's video at times.
        // That's because Android's Video utilizes EGL and EGL gives us only two
        // practical layers in which we can place our participants' videos:
        // layer #0 sits behind the window, creates a hole in the window, and
        // there we render the LargeVideo; layer #1 is known as media overlay in
        // EGL terms, renders on top of layer #0, and, consequently, is for the
        // Filmstrip. With the separate LocalThumnail, we should have left the
        // remote participants' Thumbnails in layer #1 and utilized layer #2 for
        // LocalThumbnail. Unfortunately, layer #2 is not practical (that's why
        // I said we had two practical layers only) because it renders on top of
        // everything which in our case means on top of participant-related
        // indicators such as moderator, audio and video muted, etc. For now we
        // do not have much of a choice but to continue rendering LocalThumbnail
        // as any other remote Thumbnail on Android.
        this._separateLocalThumbnail = Platform.OS !== 'android';

        this._getItemLayout = this._getItemLayout.bind(this);
        this._debouncedViewableItemsChanged = debounce(
            this._onViewableItemsChanged.bind(this),
            300);
        this._renderItem = this._renderItem.bind(this);
        this._viewablilityConfig = {
            itemVisiblePercentThreshold: 20,
            minimumViewTime: 500,
            waitForInteraction: false,
        };

        this.state = { extraData: null };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _aspectRatio, _initialNumToRender, _participants, _visible } = this.props;

        if (!_visible) {
            return null;
        }

        const isNarrowAspectRatio = _aspectRatio === ASPECT_RATIO_NARROW;
        const filmstripStyle = isNarrowAspectRatio ? styles.filmstripNarrow : styles.filmstripWide;

        return (
            <SafeAreaView style = { filmstripStyle }>
                {
                    this._separateLocalThumbnail
                        && <LocalThumbnail />
                }
                <FlatList
                    data = { _participants }
                    extraData = { this.state.extraData }
                    horizontal = { isNarrowAspectRatio }
                    getItemLayout = { this._getItemLayout }
                    initialNumToRender = { _initialNumToRender }
                    keyExtractor = { this._keyExtractor }
                    style = { styles.scrollView }
                    onViewableItemsChanged = { this._debouncedViewableItemsChanged }
                    remoteClippedSubviews = { true }
                    renderItem = { this._renderItem }
                    viewablilityConfig = { this._viewablilityConfig }
                    windowSize = { 1 } >
                </FlatList>
            </SafeAreaView>
        );
    }

    _getItemLayout(data, index) {
        const length = SMALL_THUMBNAIL_SIZE + 2;
        return {
            length,
            offset: length * index,
            index,
        }
    }

    _keyExtractor(item) {
        return item;
    }

    _onViewableItemsChanged = change => {
        const { dispatch } = this.props;
        const { viewableItems } = change;
        const startIndex = viewableItems[0].index;
        const endIndex = startIndex + viewableItems.length - 1;
        // console.log('onViewableItemsChanged:', startIndex, endIndex, viewableItems.length);
        dispatch(setVisibleRemoteParticipants(startIndex, endIndex));
        this.setState({ extraData: [startIndex, endIndex] });
    }

    _renderItem({ item, index }) {
        const {
            _visibleParticipantsStartIndex: startIndex,
            _visibleParticipantsEndIndex: endIndex,
        } = this.props;

        console.log('renderItem:', index, startIndex, endIndex);
        return (
            <Thumbnail
                participantID = { item }
                hidden = { startIndex > index || index > endIndex } />
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated {@code Filmstrip}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const {
        enabled,
        remoteParticipants,
        visibleParticipantsStartIndex,
        visibleParticipantsEndIndex,
    } = state['features/filmstrip'];
    const _localParticipant = getLocalParticipant(state)?.id;
    const { aspectRatio, clientHeight, clientWidth } = state['features/base/responsive-ui'];
    const isNarrowAspectRatio = aspectRatio === ASPECT_RATIO_NARROW;
    const _separateLocalThumbnail = Platform.OS !== 'android';
    let participants = remoteParticipants;
    let initialNumToRender;

    if (!_separateLocalThumbnail) {
        participants = [ _localParticipant, ...remoteParticipants ];
    }
    if (isNarrowAspectRatio) {
        initialNumToRender = Math.floor(clientWidth / SMALL_THUMBNAIL_SIZE);
    } else {
        initialNumToRender = Math.floor(clientHeight / SMALL_THUMBNAIL_SIZE);
    }

    const showRemoteVideos = shouldRemoteVideosBeVisible(state);

    return {
        _aspectRatio: aspectRatio,
        _initialNumToRender: initialNumToRender,
        _participants: showRemoteVideos ? participants : NO_REMOTE_VIDEOS,
        _visible: enabled && isFilmstripVisible(state),
        _visibleParticipantsStartIndex: visibleParticipantsStartIndex,
        _visibleParticipantsEndIndex: visibleParticipantsEndIndex,
    };
}

export default connect(_mapStateToProps)(Filmstrip);
