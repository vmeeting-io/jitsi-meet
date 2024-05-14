// @flow

import AbstractButton from '../../base/toolbox/components/AbstractButton';
import { openSTTDialog } from '../actions';

/**
 * The button component which starts/stops the transcription.
 */
export class AbstractSTTDialogButton extends AbstractButton {
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
    //const { sttEnabled } = state['features/base/config'];
    const { toolbarButtons } = state['features/toolbox'];

    // if the participant is moderator, it can enable transcriptions and if
    // transcriptions are already started for the meeting, guests can just show them
    let { visible } = ownProps;

    if (!toolbarButtons.includes('stt')){
        visible = false;
    }

    if (typeof visible === 'undefined'){
        visible = toolbarButtons.includes('stt');
    }
    
    return {
        visible
    };
}
