// @flow

import { IconCodeBlock } from '../../base/icons';
import { updateSettings } from '../../base/settings';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';

export type Props = AbstractButtonProps & {

    /**
     * Callback to invoke when the flip has been changed.
     */
    onFlipXChanged: Function,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * An abstract local video menu button which flip the local video.
 */
export default class AbstractFlipVideoButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'videothumbnail.flip';
    icon = IconCodeBlock;
    label = 'videothumbnail.flip';

    /**
     * Handles clicking / pressing the button, and flip local video.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { _localFlipX, dispatch, onFlipXChanged } = this.props;

        onFlipXChanged && onFlipXChanged(!_localFlipX);
        dispatch(updateSettings({
            localFlipX: !_localFlipX
        }));
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @private
 * @returns {{
 *     _localFlipX: boolean
 * }}
 */
export function _mapStateToProps(state: Object) {
    return {
        _localFlipX: Boolean(state['features/base/settings'].localFlipX)
    };
}
