// @flow

import React from 'react';

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconMuteVideoEveryoneElse } from '../../../base/icons';
import { MEDIA_TYPE } from '../../../base/media';
import { connect } from '../../../base/redux';
import { showConfirmDialog } from '../../../notifications';
import { muteAllParticipants } from '../../actions.any';
import AbstractMuteEveryoneElsesVideoButton, {
    type Props
} from '../AbstractMuteEveryoneElsesVideoButton';

import VideoMenuButton from './VideoMenuButton';

/**
 * Implements a React {@link Component} which displays a button for audio muting
 * every participant in the conference except the one with the given
 * participantID
 */
class MuteEveryoneElsesVideoButton extends AbstractMuteEveryoneElsesVideoButton {
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
        const { participantID, t } = this.props;

        return (
            <VideoMenuButton
                buttonText = { t('videothumbnail.domuteVideoOfOthers') }
                displayClass = { 'mutelink' }
                icon = { IconMuteVideoEveryoneElse }
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

        sendAnalytics(createToolbarEvent('mute.everyoneelsesvideo.pressed'));
        showConfirmDialog({
            cancelButtonText: t('dialog.Cancel'),
            confirmButtonText: t(`videothumbnail.domuteVideoOfOthers`),
            showCancelButton: true,
            text: t(`dialog.muteEveryoneElsesVideoTitle`, { whom })
        }).then(result => {
            if (result.isConfirmed) {
                dispatch(muteAllParticipants(exclude, MEDIA_TYPE.VIDEO));
            }
        });
        // dispatch(openDialog(MuteEveryoneDialog, { exclude: [ participantID ], mute }));
    }
}

export default translate(connect()(MuteEveryoneElsesVideoButton));
