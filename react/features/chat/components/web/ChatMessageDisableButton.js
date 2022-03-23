// @flow

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractChatMessageDisableButton, {
    _mapStateToProps as _abstractMapStateToProps,
    type Props
} from '../../../video-menu/components/AbstractChatMessageDisableButton';

declare var interfaceConfig: Object;

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code RecordButton} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the Component.
 * @private
 * @returns {{
 *     _isChatMessageDisabled: boolean,
 *     visible: boolean
 * }}
 */

export function _mapStateToProps(state: Object, ownProps: Props): Object {
    const abstractProps = _abstractMapStateToProps(state, ownProps);
    let { visible } = ownProps;

    if (typeof visible === 'undefined') {
        visible = abstractProps.visible;
    }

    return {
        ...abstractProps,
        visible
    };
}

export default translate(connect(_mapStateToProps)(AbstractChatMessageDisableButton));