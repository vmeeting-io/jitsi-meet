import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { updateSettings } from '../../../base/settings/actions';
import { getHideSelfView } from '../../../base/settings/functions';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';

/**
 * Implements a React {@link Component} which displays a button for hiding the local video.
 *
 * @augments Component
 */
class HideSelfViewVideoButton extends PureComponent {
    /**
     * Initializes a new {@code HideSelfViewVideoButton} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {null|ReactElement}
     */
    render() {
        const {
            className,
            t
        } = this.props;

        return (
            <ContextMenuItem
                accessibilityLabel = { t('videothumbnail.hideSelfView') }
                className = 'hideselflink'
                id = 'hideselfviewButton'
                onClick = { this._onClick }
                text = { t('videothumbnail.hideSelfView') }
                textClassName = { className } />
        );
    }

    /**
     * Hides the local video.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        const { disableSelfView, dispatch, notifyClick, notifyMode, onClick } = this.props;

        notifyClick?.();
        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }
        onClick?.();
        dispatch(updateSettings({
            disableSelfView: !disableSelfView
        }));
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code HideSelfViewVideoButton}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state) {
    return {
        disableSelfView: Boolean(getHideSelfView(state))
    };
}

export default translate(connect(_mapStateToProps)(HideSelfViewVideoButton));
