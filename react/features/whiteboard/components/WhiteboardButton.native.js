// @flow

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { IconShareDoc } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { navigate } from '../../conference/components/native/ConferenceNavigationContainerRef';
import { screen } from '../../conference/components/native/routes';


type Props = AbstractButtonProps;

/**
 * Implements an {@link AbstractButton} to open the chat screen on mobile.
 */
class WhiteboardButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.whiteboard';
    icon = IconShareDoc;
    label = 'toolbar.whiteboardOpen';
    tooltip = 'toolbar.whiteboardOpen';

    /**
     * Handles clicking / pressing the button, and opens / closes the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { handleClick } = this.props;

        if (handleClick) {
            handleClick();

            return;
        }

        sendAnalytics(createToolbarEvent(
            'toggle.whiteboard',
            {
                enable: true
            }));

        navigate(screen.conference.whiteboard);
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
    const { url } = state['features/whiteboard'];
    const { visible = Boolean(url) } = ownProps;

    return {
        visible
    };
}

export default translate(connect(_mapStateToProps)(WhiteboardButton));
