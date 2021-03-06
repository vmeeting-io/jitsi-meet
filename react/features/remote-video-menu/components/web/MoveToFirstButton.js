/* @flow */

import React from 'react';

import { translate } from '../../../base/i18n';
import { IconAngleDoubleLeft } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton } from '../../../base/toolbox/components';
import { moveToFirst } from '../../../video-layout';

import RemoteVideoMenuButton from './RemoteVideoMenuButton';

/**
 * Implements a React {@link Component} which displays a button for move
 * a participant to first in the tileview
 */
class MoveToFirstButton extends AbstractButton {
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
            <RemoteVideoMenuButton
                buttonText = { t('videothumbnail.moveToFirst') }
                icon = { IconAngleDoubleLeft }
                id = { `movetofirst_${participantID}` }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick } />
        );
    }

    _handleClick: () => void

    _handleClick() {
        const { dispatch, participantID } = this.props;
        dispatch(moveToFirst(participantID));
    }
}

export default translate(connect()(MoveToFirstButton));
