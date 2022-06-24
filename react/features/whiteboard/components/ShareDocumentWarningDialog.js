// @flow

import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { getLocalParticipant } from '../../base/participants';
import { connect } from '../../base/redux';
import { isForceMuted } from '../../participants-pane/functions';
import { toggleWhiteboard } from '../actions';

export type Props = {

    /**
     * The redux {@code dispatch} function.
     */
     dispatch: Dispatch<any>,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 *  Component that displays the share audio helper dialog.
 */
class ShareDocumentWarningDialog extends Component<Props> {

    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this._onStopSharing = this._onStopSharing.bind(this);
    }

    _onStopSharing: () => boolean;

    /**
     * Stop current screen sharing session.
     *
     * @returns {boolean}
     */
    _onStopSharing() {
        const { _approvedWhiteboard, dispatch } = this.props;

        if (_approvedWhiteboard) {
            // Depending on the context from which this dialog is opened we'll either be toggling off an audio only
            // share session or a normal screen sharing one, this is indicated by the _isAudioScreenShareWarning prop.
            dispatch(toggleWhiteboard());
        }

        return true;
    }

    /**
     * Implements {@Component#render}.
     *§.
     *
     * @inheritdoc
     */
    render() {
        const { _approvedWhiteboard, t } = this.props;

        let description1, stopSharing, title, hideCancelButton = false;

        title = 'dialog.shareDocumentWarningTitle';
        if (!_approvedWhiteboard) {
            description1 = 'dialog.shareDocumentWarningD2';
            stopSharing = 'dialog.Ok';
            hideCancelButton = true;
        } else {
            description1 = 'dialog.shareDocumentWarningD1';
            stopSharing = 'toolbar.stopDocumentSharing';
        }

        return (<Dialog
            hideCancelButton = { hideCancelButton }
            okKey = { t(stopSharing) }
            onSubmit = { this._onStopSharing }
            titleKey = { t(title) }
            width = { 'small' }>
            <div className = 'share-document-warn-dialog'>
                <p className = 'description' > { t(description1) } </p>
            </div>
        </Dialog>);

    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    const local = getLocalParticipant(state);
    const _approvedWhiteboard = !isForceMuted(local, 'whiteboard', state);

    return {
        _approvedWhiteboard,
    };
}

export default translate(connect(mapStateToProps)(ShareDocumentWarningDialog));
