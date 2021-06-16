// @flow

import React from 'react';

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconMicDisabled, IconMicrophone } from '../../../base/icons';
import { MEDIA_TYPE } from '../../../base/media';
import { connect } from '../../../base/redux';
import { showConfirmDialog } from '../../../notifications';
import { muteAllParticipants } from '../../actions';
import AbstractMuteEveryoneElseButton, {
    type Props
} from '../AbstractMuteEveryoneElseButton';

import VideoMenuButton from './VideoMenuButton';

/**
 * Implements a React {@link Component} which displays a button for audio muting
 * every participant in the conference except the one with the given
 * participantID
 */
class MuteEveryoneElseButton extends AbstractMuteEveryoneElseButton {
    /**
     * Instantiates a new {@code Component}.
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
            <VideoMenuButton
                buttonText = { t('videothumbnail.domuteOthers') }
                displayClass = { 'mutelink' }
                icon = { mute ? IconMicDisabled : IconMicrophone }
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
        const { dispatch, participantID, t } = this.props;
        const conference = APP.conference;
        const exclude = [ participantID ];
        const whom = exclude
            // eslint-disable-next-line no-confusing-arrow
            .map(id => conference.isLocalId(id)
                ? t('me')
                : conference.getParticipantDisplayName(id))
            .join(', ');

        sendAnalytics(createToolbarEvent('mute.everyoneelse.pressed'));
        showConfirmDialog({
            cancelButtonText: t('dialog.Cancel'),
            confirmButtonText: t(`videothumbnail.domute`),
            showCancelButton: true,
            text: t(`dialog.muteEveryoneElseTitle`, { whom })
        }).then(result => {
            if (result.isConfirmed) {
                dispatch(muteAllParticipants(exclude, MEDIA_TYPE.AUDIO));
            }
        });
    }
}

export default translate(connect()(MuteEveryoneElseButton));