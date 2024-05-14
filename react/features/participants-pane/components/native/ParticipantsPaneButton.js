// @flow

import type { Dispatch } from 'redux';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconParticipants } from '../../../base/icons/svg';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { navigate }
    from '../../../conference/components/native/ConferenceNavigationContainerRef';
import { screen } from '../../../conference/components/native/routes';


/**
 * Implements an {@link AbstractButton} to open the participants panel.
 */
class ParticipantsPaneButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.participants';
    icon = IconParticipants;
    label = 'toolbar.participants';

    /**
     * Handles clicking / pressing the button, and opens the participants panel.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        return navigate(screen.conference.participants);
    }
}

export default translate(connect()(ParticipantsPaneButton));
