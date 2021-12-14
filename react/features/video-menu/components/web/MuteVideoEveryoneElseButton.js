// @flow

import React from 'react';

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconCamera, IconCameraDisabled } from '../../../base/icons';
import { MEDIA_TYPE } from '../../../base/media';
import { connect } from '../../../base/redux';
import { showConfirmDialog } from '../../../notifications';
import { muteAllParticipants } from '../../actions.any';
import AbstractMuteVideoButton, {
    _mapStateToProps,
    type Props
} from '../AbstractMuteVideoButton';

import RemoteVideoMenuButton from './RemoteVideoMenuButton';

/**
 * Implements a React {@link Component} which displays a button for video muting
 * every participant in the conference except the one with the given
 * participantID
 */
class MuteVideoEveryoneElseButton extends AbstractMuteVideoButton {
    /**
     * Instantiates a new {@code MuteVideoEveryoneElseButton}.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._handleClick = this._handleClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { mute, participantID, t } = this.props;

        return (
            <RemoteVideoMenuButton
                buttonText = { t(`videothumbnail.domuteVideoOfOthers`) }
                displayClass = { 'mutelink' }
                icon = { mute ? IconCameraDisabled : IconCamera }
                id = { `mutelink_${participantID}` }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick } />
        );
    }

    _handleClick: () => void;

    /**
     * Handles clicking / pressing the button, and opens a confirmation dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participantID, mute, t } = this.props;
        const conference = APP.conference;
        const exclude = [ participantID ];
        const whom = exclude
            // eslint-disable-next-line no-confusing-arrow
            .map(id => conference.isLocalId(id)
                ? t('me')
                : conference.getParticipantDisplayName(id))
            .join(', ');

        sendAnalytics(createToolbarEvent('mutevideo.everyoneelse.pressed'));
        showConfirmDialog({
            cancelButtonText: t('dialog.Cancel'),
            confirmButtonText: t(`videothumbnail.domuteVideo`),
            showCancelButton: true,
            text: t(`dialog.muteEveryoneElsesVideoTitle`, { whom })
        }).then(result => {
            if (result.isConfirmed) {
                dispatch(muteAllParticipants(exclude, MEDIA_TYPE.VIDEO));
            }
        });
    }
}

export default translate(connect(_mapStateToProps)(MuteVideoEveryoneElseButton));
