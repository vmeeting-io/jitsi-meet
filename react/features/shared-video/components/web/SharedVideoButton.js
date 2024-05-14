// @flow
import { connect } from 'react-redux';

import { openDialog } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import { IconPlay } from '../../../base/icons/svg';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import ShareDocumentWarningDialog from '../../../whiteboard/components/ShareDocumentWarningDialog';
import { toggleSharedVideo } from '../../actions.any';
import { isSharingStatus } from '../../functions';

/**
 * Implements an {@link AbstractButton} to open the user documentation in a new window.
 */
class SharedVideoButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.sharedvideo';
    toggledAccessibilityLabel = 'toolbar.accessibilityLabel.stopSharedVideo';
    icon = IconPlay;
    label = 'toolbar.sharedvideo';
    toggledLabel = 'toolbar.stopSharedVideo';
    tooltip = 'toolbar.sharedvideo';
    toggledTooltip = 'toolbar.stopSharedVideo';

    /**
     * Handles clicking / pressing the button, and opens a new dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { _documentSharing, dispatch } = this.props;

        if (_documentSharing) {
            dispatch(openDialog(ShareDocumentWarningDialog));

            return;
        }

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
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state): Object {
    const {
        disabled: sharedVideoBtnDisabled,
        status: sharedVideoStatus
    } = state['features/shared-video'];
    const { editing } = state['features/whiteboard'];

    return {
        _documentSharing: Boolean(editing),
        _isDisabled: sharedVideoBtnDisabled,
        _sharingVideo: isSharingStatus(sharedVideoStatus)
    };
}


export default translate(connect(_mapStateToProps)(SharedVideoButton));