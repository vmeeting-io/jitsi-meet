// @flow

import type { Dispatch } from 'redux';

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { IconShareDoc } from '../../base/icons';
import { getLocalParticipant } from '../../base/participants';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { isForceMuted } from '../../participants-pane/functions';
import { toggleWhiteboard } from '../../whiteboard/actions';


type Props = AbstractButtonProps & {

    /**
     * Whether the whiteboard is being edited or not.
     */
    _editing: boolean,

    /**
     * Redux dispatch function.
     */
    dispatch: Dispatch<any>,
};

/**
 * Implements an {@link AbstractButton} to open the chat screen on mobile.
 */
class WhiteboardButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.whiteboard';
    icon = IconShareDoc;
    label = 'toolbar.whiteboard';

    /**
     * Dynamically retrieves tooltip based on sharing state.
     */
    get tooltip() {
        return 'toolbar.whiteboard';
    }

    /**
     * Required by linter due to AbstractButton overwritten prop being writable.
     *
     * @param {string} _value - The value.
     */
    set tooltip(_value) {
        // Unused.
    }

    /**
     * Handles clicking / pressing the button, and opens / closes the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { _editing, dispatch, handleClick } = this.props;

        if (handleClick) {
            handleClick();

            return;
        }

        sendAnalytics(createToolbarEvent(
            'toggle.whiteboard',
            {
                enable: !_editing
            }));

        if (this.props.closeOverflowMenu) {
            this.props.closeOverflowMenu();
        }
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return false;
    }

    /**
     * Indicates whether this button is in disabled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return !this.props._approved;
    }

}

/**
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The redux store/state.
 * @param {Object} ownProps - The properties explicitly passed to the component
 * instance.
 * @returns {Object}
 */
function _mapStateToProps(state: Object, ownProps: Object) {
    const { url, editing } = state['features/whiteboard'];
    const { visible = Boolean(url) } = ownProps;
    const local = getLocalParticipant(state);
    const _approved = !isForceMuted(local, 'whiteboard', state);

    return {
        _approved,
        _editing: editing,
        visible
    };
}

export default translate(connect(_mapStateToProps)(WhiteboardButton));
