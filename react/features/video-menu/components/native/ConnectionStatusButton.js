// @flow
import { connect } from 'react-redux';

import { openDialog } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import { IconInfo } from '../../../base/icons/svg';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';

import ConnectionStatusComponent from './ConnectionStatusComponent';

/**
 * A remote video menu button which shows the connection statistics.
 */
class ConnectionStatusButton extends AbstractButton {
    icon = IconInfo;
    label = 'videothumbnail.connectionInfo';

    /**
     * Handles clicking / pressing the button, and kicks the participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participantID } = this.props;

        dispatch(openDialog(ConnectionStatusComponent, {
            participantID
        }));
    }
}

export default translate(connect()(ConnectionStatusButton));
