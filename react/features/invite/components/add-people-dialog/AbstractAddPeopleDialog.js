import { Component } from 'react';

import { createInviteDialogEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { getMeetingRegion } from '../../../base/config/functions.any';
import { showErrorNotification, showNotification } from '../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../../notifications/constants';
import { invite } from '../../actions.any';
import { INVITE_TYPES } from '../../constants';
import {
    getInviteResultsForQuery,
    getInviteTypeCounts,
    isAddPeopleEnabled,
    isDialOutEnabled,
    isSipInviteEnabled
} from '../../functions';
import logger from '../../logger';

/**
 * Implements an abstract dialog to invite people to the conference.
 */
export default class AbstractAddPeopleDialog extends Component {
    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this._query = this._query.bind(this);
    }

    /**
     * Retrieves the notification display name for the invitee.
     *
     * @param {IInvitee} invitee - The invitee object.
     * @returns {string}
     */
    _getDisplayName(invitee) {
        if (invitee.type === INVITE_TYPES.PHONE) {
            return invitee.number;
        }

        if (invitee.type === INVITE_TYPES.SIP) {
            return invitee.address;
        }

        return invitee.name ?? '';
    }

    /**
     * Invite people and numbers to the conference. The logic works by inviting
     * numbers, people/rooms, sip endpoints and videosipgw in parallel. All invitees are
     * stored in an array. As each invite succeeds, the invitee is removed
     * from the array. After all invites finish, close the modal if there are
     * no invites left to send. If any are left, that means an invite failed
     * and an error state should display.
     *
     * @param {Array<IInvitee>} invitees - The items to be invited.
     * @returns {Promise<Array<any>>}
     */
    _invite(invitees) {
        const inviteTypeCounts = getInviteTypeCounts(invitees);

        sendAnalytics(createInviteDialogEvent(
            'clicked', 'inviteButton', {
                ...inviteTypeCounts,
                inviteAllowed: this._isAddDisabled()
            }));

        if (this._isAddDisabled()) {
            return Promise.resolve([]);
        }

        this.setState({
            addToCallInProgress: true
        });

        const { _callFlowsEnabled, dispatch } = this.props;

        return dispatch(invite(invitees))
            .then((invitesLeftToSend) => {
                this.setState({
                    addToCallInProgress: false
                });

                // If any invites are left that means something failed to send
                // so treat it as an error.
                if (invitesLeftToSend.length) {
                    const erroredInviteTypeCounts
                        = getInviteTypeCounts(invitesLeftToSend);

                    logger.error(`${invitesLeftToSend.length} invites failed`,
                        erroredInviteTypeCounts);

                    sendAnalytics(createInviteDialogEvent(
                        'error', 'invite', {
                            ...erroredInviteTypeCounts
                        }));
                    dispatch(showErrorNotification({
                        titleKey: 'addPeople.failedToAdd'
                    }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
                } else if (!_callFlowsEnabled) {
                    const invitedCount = invitees.length;
                    let notificationProps;

                    if (invitedCount >= 3) {
                        notificationProps = {
                            titleArguments: {
                                name: this._getDisplayName(invitees[0]),
                                count: `${invitedCount - 1}`
                            },
                            titleKey: 'notify.invitedThreePlusMembers'
                        };
                    } else if (invitedCount === 2) {
                        notificationProps = {
                            titleArguments: {
                                first: this._getDisplayName(invitees[0]),
                                second: this._getDisplayName(invitees[1])
                            },
                            titleKey: 'notify.invitedTwoMembers'
                        };
                    } else if (invitedCount) {
                        notificationProps = {
                            titleArguments: {
                                name: this._getDisplayName(invitees[0])
                            },
                            titleKey: 'notify.invitedOneMember'
                        };
                    }

                    if (notificationProps) {
                        dispatch(
                            showNotification(notificationProps, NOTIFICATION_TIMEOUT_TYPE.SHORT));
                    }
                }

                return invitesLeftToSend;
            });
    }

    /**
     * Indicates if the Add button should be disabled.
     *
     * @private
     * @returns {boolean} - True to indicate that the Add button should
     * be disabled, false otherwise.
     */
    _isAddDisabled() {
        return !this.state.inviteItems.length
            || this.state.addToCallInProgress;
    }

    /**
     * Performs a people and phone number search request.
     *
     * @param {string} query - The search text.
     * @private
     * @returns {Promise}
     */
    _query(query = '') {
        const {
            _addPeopleEnabled: addPeopleEnabled,
            _appId: appId,
            _dialOutAuthUrl: dialOutAuthUrl,
            _dialOutRegionUrl: dialOutRegionUrl,
            _dialOutEnabled: dialOutEnabled,
            _jwt: jwt,
            _peopleSearchQueryTypes: peopleSearchQueryTypes,
            _peopleSearchUrl: peopleSearchUrl,
            _region: region,
            _sipInviteEnabled: sipInviteEnabled
        } = this.props;
        const options = {
            addPeopleEnabled,
            appId,
            dialOutAuthUrl,
            dialOutEnabled,
            dialOutRegionUrl,
            jwt,
            peopleSearchQueryTypes,
            peopleSearchUrl,
            region,
            sipInviteEnabled
        };

        return getInviteResultsForQuery(query, options);
    }

}

/**
 * Maps (parts of) the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _addPeopleEnabled: boolean,
 *     _dialOutAuthUrl: string,
 *     _dialOutEnabled: boolean,
 *     _jwt: string,
 *     _peopleSearchQueryTypes: Array<string>,
 *     _peopleSearchUrl: string
 * }}
 */
export function _mapStateToProps(state) {
    const {
        callFlowsEnabled,
        dialOutAuthUrl,
        dialOutRegionUrl,
        peopleSearchQueryTypes,
        peopleSearchUrl
    } = state['features/base/config'];

    return {
        _addPeopleEnabled: isAddPeopleEnabled(state),
        _appId: state['features/base/jwt']?.tenant ?? '',
        _callFlowsEnabled: callFlowsEnabled ?? false,
        _dialOutAuthUrl: dialOutAuthUrl ?? '',
        _dialOutRegionUrl: dialOutRegionUrl ?? '',
        _dialOutEnabled: isDialOutEnabled(state),
        _jwt: state['features/base/jwt'].jwt ?? '',
        _peopleSearchQueryTypes: peopleSearchQueryTypes ?? [],
        _peopleSearchUrl: peopleSearchUrl ?? '',
        _region: getMeetingRegion(state),
        _sipInviteEnabled: isSipInviteEnabled(state)
    };
}
