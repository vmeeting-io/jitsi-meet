import React, { PureComponent } from 'react';

import { translate } from '../../../../base/i18n/functions';
import Select from '../../../../base/ui/components/web/Select';
import { YOUTUBE_LIVE_DASHBOARD_URL } from '../constants';

/**
 * A dropdown to select a YouTube broadcast.
 *
 * @augments Component
 */
class StreamKeyPicker extends PureComponent {
    /**
     * Default values for {@code StreamKeyForm} component's properties.
     *
     * @static
     */
    static defaultProps = {
        broadcasts: []
    };

    /**
     * The initial state of a {@code StreamKeyForm} instance.
     */
    state = {
        isDropdownOpen: false
    };

    /**
     * Initializes a new {@code StreamKeyPicker} instance.
     *
     * @param {IProps} props - The React {@code Component} props to initialize
     * the new {@code StreamKeyPicker} instance with.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onSelect = this._onSelect.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { broadcasts, selectedBoundStreamID, t } = this.props;

        if (!broadcasts.length) {
            return (
                <a
                    className = 'warning-text'
                    href = { YOUTUBE_LIVE_DASHBOARD_URL }
                    rel = 'noopener noreferrer'
                    target = '_blank'>
                    { t('liveStreaming.getStreamKeyManually') }
                </a>
            );
        }

        const dropdownItems
            = broadcasts.map(broadcast => {
                return {
                    value: broadcast.boundStreamID,
                    label: broadcast.title
                };
            });

        return (
            <div className = 'broadcast-dropdown dropdown-menu'>
                <Select
                    id = 'streamkeypicker-select'
                    label = { t('liveStreaming.choose') }
                    onChange = { this._onSelect }
                    options = { dropdownItems }
                    value = { selectedBoundStreamID ?? '' } />
            </div>
        );
    }

    /**
     * Callback invoked when an item has been clicked in the dropdown menu.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onSelect(e) {
        const streamId = e.target.value;

        this.props.onBroadcastSelected(streamId);
    }
}

export default translate(StreamKeyPicker);
