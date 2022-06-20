// @flow

import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
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
        // Depending on the context from which this dialog is opened we'll either be toggling off an audio only
        // share session or a normal screen sharing one, this is indicated by the _isAudioScreenShareWarning prop.
        this.props.dispatch(toggleWhiteboard());

        return true;
    }

    /**
     * Implements {@Component#render}.
     *§.
     *
     * @inheritdoc
     */
    render() {
        const { t } = this.props;

        let description1, stopSharing, title;

        description1 = 'dialog.shareDocumentWarningD1';
        title = 'dialog.shareDocumentWarningTitle';
        stopSharing = 'toolbar.stopDocumentSharing';

        return (<Dialog
            hideCancelButton = { false }
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

export default translate(connect()(ShareDocumentWarningDialog));
