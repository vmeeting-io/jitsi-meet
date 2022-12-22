// @flow

import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { openSTTDialog } from '../actions';
import { isLocalParticipantModerator } from '../../base/participants';

export type AbstractProps = AbstractButtonProps & {

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * Invoked to Dispatch an Action to the redux store.
     */
    dispatch: Function,
};

/**
 * The button component which starts/stops the transcription.
 */
export class AbstractSTTDialogButton
    extends AbstractButton<AbstractProps, *> {
    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    async _handleClick() {
        const { handleClick, dispatch } = this.props;

        if (handleClick) {
            handleClick();

            return;
        }
        dispatch(openSTTDialog());
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return false;
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    // _isToggled() {
    //    return true;
    // }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code AbstractSTTDialogButton} component.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component
 * instance.
 * @private
 * @returns {{
 *     visible: boolean
 * }}
 */
export function _abstractMapStateToProps(state: Object, ownProps: Object) {
    const { sttEnabled } = state['features/base/config'];
    const sttOn = state['features/stt']._sttEnabled;

    // if the participant is moderator, it can enable transcriptions and if
    // transcriptions are already started for the meeting, guests can just show them
    let { visible } = ownProps;
    if (typeof visible === 'undefined'){
        const isModerator = isLocalParticipantModerator(state);

        visible = (isModerator && sttEnabled) || sttOn;
    }
    
    return {
        visible
    };
}
