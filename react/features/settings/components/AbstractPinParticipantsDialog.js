// @flow

import { Component } from 'react';
import { pinTiles } from '../../base/participants';

// import { pinParticipants } from '../../base/participants';

type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * Function to translate i18n labels.
     */
    t: Function
};

/**
 * Abstract dialog to pin participant tiles.
 */
export default class AbstractPinParticipantsDialog
    extends Component<Props> {
    /**
     * Initializes a new {@code AbstractPinParticipantsDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onSubmit = this._onSubmit.bind(this);
    }

    _onSubmit: () => boolean;

    /**
     * Callback for the confirm button.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit(pinned) {
        this.props.dispatch(pinTiles(pinned));

        return true;
    }
}
