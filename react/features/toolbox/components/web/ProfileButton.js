import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { translate } from '../../../base/i18n/functions';
import { getLocalParticipant } from '../../../base/participants/functions';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { openSettingsDialog } from '../../../settings/actions';
import { SETTINGS_TABS } from '../../../settings/constants';

import ProfileButtonAvatar from './ProfileButtonAvatar';

/**
 * Implementation of a button for opening profile dialog.
 */
class ProfileButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.profile';
    icon = ProfileButtonAvatar;

    /**
     * Retrieves the label.
     *
     * @returns {string}
     */
    _getLabel() {
        const {
            _defaultLocalDisplayName,
            _localParticipant
        } = this.props;
        let displayName;

        if (_localParticipant?.name) {
            displayName = _localParticipant.name;
        } else {
            displayName = _defaultLocalDisplayName;
        }

        return displayName;
    }

    /**
     * Retrieves the tooltip.
     *
     * @returns {string}
     */
    _getTooltip() {
        return this._getLabel();
    }

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, _unclickable } = this.props;

        if (!_unclickable) {
            sendAnalytics(createToolbarEvent('profile'));
            dispatch(openSettingsDialog(SETTINGS_TABS.PROFILE));
        }
    }

    /**
     * Indicates whether the button should be disabled or not.
     *
     * @protected
     * @returns {void}
     */
    _isDisabled() {
        return this.props._unclickable;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
const mapStateToProps = (state) => {
    const { defaultLocalDisplayName } = state['features/base/config'];

    return {
        _defaultLocalDisplayName: defaultLocalDisplayName ?? '',
        _localParticipant: getLocalParticipant(state),
        _unclickable: !interfaceConfig.SETTINGS_SECTIONS.includes('profile'),
        customClass: 'profile-button-avatar'
    };
};

export default translate(connect(mapStateToProps)(ProfileButton));
