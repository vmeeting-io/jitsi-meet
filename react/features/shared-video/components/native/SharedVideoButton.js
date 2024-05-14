// @flow

import type { Dispatch } from 'redux';
import { connect } from 'react-redux';

import { VIDEO_SHARE_BUTTON_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconPlay } from '../../../base/icons/svg';
import { getLocalParticipant } from '../../../base/participants';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { toggleSharedVideo } from '../../actions.native';
import { isSharingStatus } from '../../functions';

/**
 * Component that renders a toolbar button for toggling the tile layout view.
 *
 * @augments AbstractButton
 */
class VideoShareButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.sharedvideo';
    icon = IconPlay;
    label = 'toolbar.sharedvideo';
    toggledLabel = 'toolbar.stopSharedVideo';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this._doToggleSharedVideo();
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._sharingVideo;
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._isDisabled;
    }

    /**
     * Dispatches an action to toggle video sharing.
     *
     * @private
     * @returns {void}
     */
    _doToggleSharedVideo() {
        this.props.dispatch(toggleSharedVideo());
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component instance.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps): Object {
    const { ownerId, status: sharedVideoStatus } = state['features/shared-video'];
    const localParticipantId = getLocalParticipant(state).id;
    const enabled = getFeatureFlag(state, VIDEO_SHARE_BUTTON_ENABLED, true);
    const { visible = enabled } = ownProps;

    if (ownerId !== localParticipantId) {
        return {
            _isDisabled: isSharingStatus(sharedVideoStatus),
            _sharingVideo: false,
            visible
        };
    }

    return {
        _isDisabled: false,
        _sharingVideo: isSharingStatus(sharedVideoStatus),
        visible
    };
}

export default translate(connect(_mapStateToProps)(VideoShareButton));
