// @flow

import axios from 'axios';
import { once } from 'lodash';
import { type Dispatch } from 'redux';
import { getAuthUrl } from '../../../../api/url';
import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { appNavigate } from '../../../app/actions';

import { translate } from '../../../base/i18n';
import { IconClose } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link HangupAllButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>
};

/**
 * An implementation of a button to raise or lower hand.
 */
class HangupAllButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.hangupAll';
    icon = IconClose;
    label = 'toolbar.hangupAll';

    _hangup = once(() => {
        sendAnalytics(createToolbarEvent('hangup'));
        this.props.dispatch(appNavigate(undefined));
    });

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    async _handleClick() {
        const { _apiBase, _roomInfo, _meetingId } = this.props;

        if (_roomInfo) {
            const apiUrl = `${_apiBase}/conferences/${_roomInfo._id}`;
            axios.delete(apiUrl);
            this._hangup();
        } else if (_meetingId) {
            try {
                const resp = await axios.get(`${_apiBase}/conferences?meeting_id=${_meetingId}`);
                const conf = resp.data?.docs[0];
                console.log(resp, conf);
                axios.delete(`${_apiBase}/conferences/${conf._id}`);
                this._hangup();
            } catch (err) {
                console.error('_onHangupAll: failed!', err);
            }
        }
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
    const { conference, roomInfo } = state['features/base/conference'];

    return {
        _apiBase: getAuthUrl(state),
        _meetingId: conference?.room?.meetingId,
        _roomInfo: roomInfo,
        styles: styles.hangupAll,
    };
}

export default translate(connect(_mapStateToProps)(HangupAllButton));
