/* @flow */

import { FieldTextStateless as TextField } from '@atlaskit/field-text';
import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractDisplayNamePrompt, {
    type Props
} from '../AbstractDisplayNamePrompt';
import { showToast } from '../../../notifications';

/**
 * The type of the React {@code Component} props of {@link DisplayNamePrompt}.
 */
type State = {

    /**
     * The name to show in the display name text field.
     */
    displayName: string
};

const NOTIFICATION_TIMEOUT = 3000;

/**
 * Implements a React {@code Component} for displaying a dialog with an field
 * for setting the local participant's display name.
 *
 * @extends Component
 */
class DisplayNamePrompt extends AbstractDisplayNamePrompt<State> {
    /**
     * Initializes a new {@code DisplayNamePrompt} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            displayName: ''
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onDisplayNameChange = this._onDisplayNameChange.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._isSubmitBtnDisabled = this._isSubmitBtnDisabled.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                // Setting the prop 'isModal' to 'true' hides the cancel button, which is our requirement for DisplayNamePrompt.
                // We want participants to input a display name value always. Thus we hide the cancel button from the dialog using isModal = true
                isModal = { true } 
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.displayNameRequired'
                // currently submitDisabled prop is not required
                // submitDisabled = { this._isSubmitBtnDisabled() }
                width = 'small'>
                <TextField
                    autoFocus = { true }
                    compact = { true }
                    label = { this.props.t('dialog.enterDisplayName') }
                    name = 'displayName'
                    onChange = { this._onDisplayNameChange }
                    shouldFitContainer = { true }
                    type = 'text'
                    value = { this.state.displayName } />
            </Dialog>);
    }

    /**
     * callback function to submitDisabled prop, NOT USED CURRENTLY
     * used to check if display name is set or not, if display name is not set, returns true
     * which is used to hide the submit button when displayName is empty
     */
    _isSubmitBtnDisabled: () => void;

    _isSubmitBtnDisabled() {
        if ((this.state.displayName.length === 0) || (this.state.displayName.trim() === "")) {
            return true;
        } else {
            return false;
        }
    }

    _onDisplayNameChange: (Object) => void;

    /**
     * Updates the entered display name.
     *
     * @param {Object} event - The DOM event triggered from the entered display
     * name value having changed.
     * @private
     * @returns {void}
     */
    _onDisplayNameChange(event) {
        this.setState({
            displayName: event.target.value
        });
    }

    _onSetDisplayName: string => boolean;

    _onSubmit: () => boolean;

    /**
     * Dispatches an action to update the local participant's display name. A
     * name must be entered for the action to dispatch.
     *
     * @private
     * @returns {boolean}
     */
    _onSubmit() {
        const { t } = this.props;

        // show a toast message if display name is set to null
        if(this.state.displayName.trim() === "" || this.state.displayName === undefined || this.state.displayName === "") {
            showToast({
                title: t('notify.noNameInserted'),
                timeout: NOTIFICATION_TIMEOUT,
                icon: 'info',
                animation: false });
        }
        return this._onSetDisplayName(this.state.displayName);
    }
}

export default translate(connect()(DisplayNamePrompt));