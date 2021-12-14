// @flow

import ScheduleIcon from '@atlaskit/icon/glyph/schedule';
import LockIcon from '@atlaskit/icon/glyph/lock';
import UnlockIcon from '@atlaskit/icon/glyph/unlock';
import TrashIcon from '@atlaskit/icon/glyph/trash';
import React, { Component } from 'react';

import {
    getLocalizedDateFormatter,
    getLocalizedDurationFormatter
} from '../../../i18n';
import { Tooltip } from '../../../tooltip';

import Container from './Container';
import Text from './Text';

type Props = {

    /**
     * Indicates if the URL should be hidden or not.
     */
    hideURL: boolean,

    /**
     * Function to be invoked when an item is pressed. The item's URL is passed.
     */
    onPress: Function,

    /**
     * Rendered when the list is empty. Should be a rendered element.
     */
    listEmptyComponent: Object,

    /**
     * An array of meetings.
     */
    meetings: Array<Object>,

    t: Function,

    /**
     * Handler for deleting an item.
     */
    onItemDelete?: Function
};

/**
 * Generates a date string for a given date.
 *
 * @param {Object} date - The date.
 * @private
 * @returns {string}
 */
function _toDateString(date) {
    // return getLocalizedDateFormatter(date).format('MMM Do, YYYY');
    return getLocalizedDateFormatter(date).format('ll');
}


/**
 * Generates a time (interval) string for a given times.
 *
 * @param {Array<Date>} times - Array of times.
 * @private
 * @returns {string}
 */
function _toTimeString(times) {
    if (times && times.length > 0) {
        return (
            times
                .map(time => getLocalizedDateFormatter(time).format('LT'))
                .join(' - '));
    }

    return undefined;
}

/**
 * Implements a React/Web {@link Component} for displaying a list with
 * meetings.
 *
 * @extends Component
 */
export default class MeetingsListFromDB extends Component<Props> {
    /**
     * Constructor of the MeetingsList component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onPress = this._onPress.bind(this);
        this._renderItem = this._renderItem.bind(this);
    }

    /**
     * Renders the content of this component.
     *
     * @returns {React.ReactNode}
     */
    render() {
        const { listEmptyComponent, meetings } = this.props;

        /**
         * If there are no recent meetings we don't want to display anything
         */
        if (meetings) {
            return (
                <Container
                    className = 'meetings-list'>
                    {
                        meetings.length === 0
                            ? listEmptyComponent
                            : meetings.map(this._renderItem)
                    }
                </Container>
            );
        }

        return null;
    }

    _onPress: string => Function;

    /**
     * Returns a function that is used in the onPress callback of the items.
     *
     * @param {string} url - The URL of the item to navigate to.
     * @private
     * @returns {Function}
     */
    _onPress(url) {
        const { onPress } = this.props;

        if ( url && typeof onPress === 'function') {
            return () => onPress(url);
        }

        return null;
    }

    _renderItem: (Object, number) => React$Node;

    _onDelete: Object => Function;

    /**
     * Returns a function that is used on the onDelete callback.
     *
     * @param {Object} item - The item to be deleted.
     * @private
     * @returns {Function}
     */
    _onDelete(item) {
        const { onItemDelete } = this.props;

        return evt => {
            evt.stopPropagation();

            onItemDelete && onItemDelete(item);
        };
    }

    /**
     * Renders an item for the list.
     *
     * @param {Object} meeting - Information about the meeting.
     * @param {number} index - The index of the item.
     * @returns {Node}
     */
    _renderItem(meeting, index) {
        const {
            schedule,
            lock,
            date,
            duration,
            elementAfter,
            time,
            title,
            url,
            owner,
            ongoing,
            current_user
        } = meeting;
        const { hideURL = false, t, onItemDelete } = this.props;
        const onPress = this._onPress(url);
        const rootClassName
            = `item ${onPress ? 'with-click-handler' : 'without-click-handler'}`;

        return (
            <Container
                className = { rootClassName }
                key = { index }
                onClick = { onPress }>
                <Container className = 'icon-column'>
                    { schedule? <ScheduleIcon size="large"/> : null }
                </Container>
                <Container className = 'icon-column'>
                    { lock? <LockIcon size="large"/> : <UnlockIcon size="large"/> }
                </Container>
                <Container className = 'left-column'>
                    <Text className = 'date'>
                        { _toDateString(date) }
                    </Text>
                    <Text>
                        { _toTimeString(time) }
                    </Text>
                </Container>
                <Container className = 'right-column'>
                    <Text className = 'title'>
                        { title }
                    </Text>
                    {
                        hideURL || !url ? null : (
                            <Text>
                                { url }
                            </Text>)
                    }
                    {
                        typeof duration === 'number' ? (
                            <Text>
                                { getLocalizedDurationFormatter(duration) }
                            </Text>) : null
                    }
                </Container>
                <Container className = 'actions'>
                    { elementAfter || null }

                    { !ongoing && owner === current_user && onItemDelete && <Tooltip content = {t('welcomepage.deleteReservation')}>
                            <div
                                className = 'delete-meeting'
                                onClick = { this._onDelete(meeting) }>
                                <TrashIcon size="large" />
                            </div>
                        </Tooltip>}
                </Container>
            </Container>
        );
    }
}
