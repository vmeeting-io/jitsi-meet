// @flow

import React, { ReactElement, useCallback } from 'react';
import { connect } from 'react-redux';

import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n/functions';
import { IconArrowUp, IconFaceSmile } from '../../../base/icons/svg';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import ToolboxButtonWithPopup from '../../../base/toolbox/components/web/ToolboxButtonWithPopup';
import { toggleReactionsMenuVisibility } from '../../actions.web';
import { getReactionsQueue } from '../../functions.any';
import { getReactionsMenuVisibility, isReactionsButtonEnabled } from '../../functions.web';
import { IReactionsMenuParent } from '../../types';

import RaiseHandButton from './RaiseHandButton';
import ReactionEmoji from './ReactionEmoji';
import ReactionsMenu from './ReactionsMenu';

/**
 * Implementation of a button for reactions.
 */
class ReactionsButtonImpl extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.reactions';
    icon = IconFaceSmile;
    label = 'toolbar.reactions';
    toggledLabel = 'toolbar.reactions';
    tooltip = 'toolbar.reactions';
}

const ReactionsButton = translate(connect()(ReactionsButtonImpl));

/**
 * Button used for the reactions menu.
 *
 * @returns {ReactElement}
 */
function ReactionsMenuButton({
    _reactionsButtonEnabled,
    _isMobile,
    buttonKey,
    dispatch,
    isOpen,
    isNarrow,
    notifyMode,
    reactionsQueue,
    showRaiseHand,
    t
}) {
    const toggleReactionsMenu = useCallback(() => {
        dispatch(toggleReactionsMenuVisibility());
    }, [ dispatch ]);

    const openReactionsMenu = useCallback(() => {
        !isOpen && toggleReactionsMenu();
    }, [ isOpen, toggleReactionsMenu ]);

    const closeReactionsMenu = useCallback(() => {
        isOpen && toggleReactionsMenu();
    }, [ isOpen, toggleReactionsMenu ]);

    if (!showRaiseHand && !_reactionsButtonEnabled) {
        return null;
    }

    const reactionsMenu = (<div className = 'reactions-menu-container'>
        <ReactionsMenu parent = { IReactionsMenuParent.Button } />
    </div>);

    let content: ReactElement | null = null;

    if (showRaiseHand) {
        content = isNarrow
            ? (
                <RaiseHandButton
                    buttonKey = { buttonKey }
                    notifyMode = { notifyMode } />)
            : (
                <ToolboxButtonWithPopup
                    ariaLabel = { t('toolbar.accessibilityLabel.reactionsMenu') }
                    icon = { IconArrowUp }
                    iconDisabled = { false }
                    onPopoverClose = { toggleReactionsMenu }
                    onPopoverOpen = { openReactionsMenu }
                    popoverContent = { reactionsMenu }
                    visible = { isOpen }>
                    <RaiseHandButton
                        buttonKey = { buttonKey }
                        notifyMode = { notifyMode } />
                </ToolboxButtonWithPopup>);
    } else {
        content = (
            <ToolboxButtonWithPopup
                ariaLabel = { t('toolbar.accessibilityLabel.reactionsMenu') }
                onPopoverClose = { closeReactionsMenu }
                onPopoverOpen = { openReactionsMenu }
                popoverContent = { reactionsMenu }
                trigger = { _isMobile ? 'click' : undefined }
                visible = { isOpen }>
                <ReactionsButton
                    buttonKey = { buttonKey }
                    notifyMode = { notifyMode } />
            </ToolboxButtonWithPopup>);
    }

    return (
        <div className = 'reactions-menu-popup-container'>
            { content }
            {reactionsQueue.map(({ reaction, uid }, index) => (<ReactionEmoji
                index = { index }
                key = { uid }
                reaction = { reaction }
                uid = { uid } />))}
        </div>
    );

}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    const { isNarrowLayout } = state['features/base/responsive-ui'];

    return {
        _reactionsButtonEnabled: isReactionsButtonEnabled(state),
        _isMobile: isMobileBrowser(),
        isOpen: getReactionsMenuVisibility(state),
        isNarrow: isNarrowLayout,
        reactionsQueue: getReactionsQueue(state)
    };
}

export default translate(connect(mapStateToProps)(ReactionsMenuButton));
