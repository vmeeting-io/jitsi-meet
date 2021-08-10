// @flow

import React, { Component } from 'react';
import {
    FlatList,
    SafeAreaView,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import type { Dispatch } from 'redux';

import { getLocalParticipant, getParticipantCountWithFake } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { ASPECT_RATIO_NARROW } from '../../../base/responsive-ui/constants';
import { setTileViewDimensions, setVisibleRemoteParticipants } from '../../actions.native';

import Thumbnail from './Thumbnail';
import styles from './styles';
import debounce from 'lodash.debounce';


/**
 * The type of the React {@link Component} props of {@link TileView}.
 */
type Props = {

    /**
     * Application's aspect ratio.
     */
    _aspectRatio: Symbol,

    /**
     * Application's viewport height.
     */
    _height: number,

    /**
     * The local participant.
     */
    _localParticipant: Object,

    /**
     * The number of participants in the conference.
     */
    _participantCount: number,

    /**
     * An array with the IDs of the remote participants in the conference.
     */
    _remoteParticipants: Array<string>,

    /**
     * Application's viewport height.
     */
    _width: number,

    /**
     * Invoked to update the receiver video quality.
     */
    dispatch: Dispatch<any>,

    /**
     * Callback to invoke when tile view is tapped.
     */
    onClick: Function
};

/**
 * The margin for each side of the tile view. Taken away from the available
 * height and width for the tile container to display in.
 *
 * @private
 * @type {number}
 */
const MARGIN = 10;

/**
 * The aspect ratio the tiles should display in.
 *
 * @private
 * @type {number}
 */
const TILE_ASPECT_RATIO = 1;

/**
 * Implements a React {@link Component} which displays thumbnails in a two
 * dimensional grid.
 *
 * @extends Component
 */
class TileView extends Component<Props> {
    constructor(props) {
        super(props);

        this.state = { extraData: null };

        this._getItemLayout = this._getItemLayout.bind(this);
        this._debouncedViewableItemsChanged = debounce(
            this._onViewableItemsChanged.bind(this),
            100);
        this._debouncedUpdateReceiverQuality = debounce(
            this._updateReceiverQuality.bind(this),
            300);
        this._renderItem = this._renderItem.bind(this);
        this._viewablilityConfig = {
            itemVisiblePercentThreshold: 20,
            minimumViewTime: 500,
            waitForInteraction: false,
        };
    }

    /**
     * Implements React's {@link Component#componentDidMount}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._debouncedUpdateReceiverQuality();
    }

    /**
     * Implements React's {@link Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate() {
        this._debouncedUpdateReceiverQuality();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _height, _width,
            _initialNumToRender,
            onClick
        } = this.props;

        return (
            <TouchableWithoutFeedback onPress = { onClick }>
                <View style = {{ height: _height, width: _width }}>
                <FlatList
                    data = { this._groupIntoRows() }
                    extraData = { this.state.extraData }
                    style = {{ flexShrink: 0 }}
                    contentContainerStyle = {{
                        ...styles.tileViewRows,
                        minHeight: _height,
                        minWidth: _width,
                        flexShrink: 0,
                    }}
                    getItemLayout = { this._getItemLayout }
                    initialNumToRender = { _initialNumToRender }
                    keyExtractor = { this._keyExtractor }
                    style = { styles.scrollView }
                    onViewableItemsChanged = { this._debouncedViewableItemsChanged }
                    remoteClippedSubviews = { true }
                    renderItem = { this._renderItem }
                    viewablilityConfig = { this._viewablilityConfig }
                    windowSize = { 1 } />
                </View>
            </TouchableWithoutFeedback>
        );
    }

    _groupIntoRows() {
        const { _columnCount: rowLength, _localParticipant, _remoteParticipants } = this.props;
        const participants = _localParticipant
            ? [_localParticipant.id, ..._remoteParticipants]
            : _remoteParticipants;
        const rowElements = [];

        for (let i = 0; i < participants.length; i++) {
            if (i % rowLength === 0) {
                const row = participants.slice(i, i + rowLength);
                rowElements.push(row);
            }
        }

        return rowElements;
    }

    _getItemLayout(data, index) {
        const length = this.props._tileHeight + 4;
        return {
            length,
            offset: length * index,
            index,
        }
    }

    _keyExtractor(item) {
        return item[0];
    }

    _onViewableItemsChanged = change => {
        const { dispatch, _columnCount } = this.props;
        const { viewableItems } = change;
        const startIndex = Math.max(viewableItems[0].index * _columnCount - 1, 0);
        const endIndex = startIndex + viewableItems.length * _columnCount - 1;
        console.log('onViewableItemsChanged:', startIndex, endIndex, viewableItems.length);
        dispatch(setVisibleRemoteParticipants(startIndex, endIndex));
        this.setState({ extraData: [startIndex, endIndex] });
    }

    /**
     * Creates React Elements to display each participant in a thumbnail. Each
     * tile will be.
     *
     * @private
     * @returns {ReactElement[]}
     */
    _renderItem({ item, index }) {
        const {
            _columnCount,
            _visibleParticipantsStartIndex: startIndex,
            _visibleParticipantsEndIndex: endIndex,
        } = this.props;
        const tIndex = index * _columnCount;
        const visible = startIndex <= tIndex && tIndex <= endIndex;

        // console.log('renderItem:', startIndex, tIndex, endIndex, visible);

        return (
            <View key = { index } style = { styles.tileViewRow }>
                { this._renderThumbnails(item, visible) }
            </View>
        );
    }

    _renderThumbnails(item, visible) {
        const styleOverrides = {
            aspectRatio: TILE_ASPECT_RATIO,
            flex: 0,
            height: this.props._tileHeight,
            maxHeight: null,
            maxWidth: null,
            width: null
        };

        return item.map(id => (
            <Thumbnail
                disableTint = { true }
                key = { id }
                participantID = { id }
                renderDisplayName = { true }
                styleOverrides = { styleOverrides }
                tileView = { true }
                hidden = { !visible } />
        ));
    }

    /**
     * Sets the receiver video quality based on the dimensions of the thumbnails
     * that are displayed.
     *
     * @private
     * @returns {void}
     */
    _updateReceiverQuality() {
        const { _tileHeight, _tileWidth } = this.props;

        this.props.dispatch(setTileViewDimensions({
            thumbnailSize: {
                height: _tileHeight,
                width: _tileWidth
            }
        }));
    }
}

/**
 * Maps (parts of) the redux state to the associated {@code TileView}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { aspectRatio, clientHeight, clientWidth } = state['features/base/responsive-ui'];
    const {
        remoteParticipants,
        visibleParticipantsStartIndex,
        visibleParticipantsEndIndex,
    } = state['features/filmstrip'];
    const localParticipant = getLocalParticipant(state);
    const participantCount = getParticipantCountWithFake(state);
    let columnCount;

    // For narrow view, tiles should stack on top of each other for a lonely
    // call and a 1:1 call. Otherwise tiles should be grouped into rows of
    // two.
    if (aspectRatio === ASPECT_RATIO_NARROW) {
        columnCount = participantCount >= 3 ? 2 : 1;
    }

    if (participantCount === 4) {
        // In wide view, a four person call should display as a 2x2 grid.
        columnCount = 2;
    }
    columnCount = columnCount ?? Math.min(3, participantCount);

    const heightToUse = clientHeight - (MARGIN * 2);
    const widthToUse = clientWidth - (MARGIN * 2);
    let tileWidth;

    // If there is going to be at least two rows, ensure that at least two
    // rows display fully on screen.
    if (participantCount / columnCount > 1) {
        tileWidth = Math.min(widthToUse / columnCount, heightToUse / 2);
    } else {
        tileWidth = Math.min(widthToUse / columnCount, heightToUse);
    }

    return {
        _aspectRatio: aspectRatio,
        _columnCount: columnCount,
        _height: clientHeight,
        _initialNumToRender: Math.floor(heightToUse / tileWidth),
        _localParticipant: localParticipant,
        _participantCount: participantCount,
        _remoteParticipants: remoteParticipants,
        _tileWidth: tileWidth,
        _tileHeight: tileWidth / TILE_ASPECT_RATIO,
        _visibleParticipantsStartIndex: visibleParticipantsStartIndex,
        _visibleParticipantsEndIndex: visibleParticipantsEndIndex,
        _width: clientWidth
    };
}

export default connect(_mapStateToProps)(TileView);
