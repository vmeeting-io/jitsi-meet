// @flow

import React, { useCallback, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { useStyles } from 'tss-react/mui';

import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n/functions';
import { getParticipantCount, isLocalParticipantModerator } from '../../../base/participants/functions';
import { isReactionsButtonEnabled, shouldDisplayReactionsButtons } from '../../../reactions/functions.web';
import {
    setHangupMenuVisible,
    setOverflowMenuVisible,
    setShareMenuVisible,
    setToolbarHovered,
    showToolbox
} from '../../actions.web';
import { NOT_APPLICABLE, THRESHOLDS } from '../../constants';
import {
    getAllToolboxButtons,
    getJwtDisabledButtons,
    isButtonEnabled,
    isToolboxVisible
} from '../../functions.web';
import { useKeyboardShortcuts } from '../../hooks.web';

import HangupMenuButton from './HangupMenuButton';
import OverflowMenuButton from './OverflowMenuButton';
import Separator from './Separator';

const Toolbox = ({
    _buttonsWithNotifyClick,
    _chatOpen,
    _clientWidth,
    _customToolbarButtons,
    _dialog,
    _disabled,
    _hangupMenuVisible,
    _isLocalModerator,
    _isMobile,
    _isNarrowLayout,
    _jwtDisabledButtons,
    _overflowDrawer,
    _overflowMenuVisible,
    _participantCount,
    _reactionsButtonEnabled,
    _shiftUp,
    _shareMenuVisible,
    _shouldDisplayReactionsButtons,
    _toolbarButtons,
    _visible,
    dispatch,
    t,
    toolbarButtons
}) => {
    const { cx } = useStyles();
    const _toolboxRef = useRef(null);

    useKeyboardShortcuts(toolbarButtons);

    useEffect(() => {
        if (!_visible) {
            if (document.activeElement instanceof HTMLElement
                && _toolboxRef.current?.contains(document.activeElement)) {
                document.activeElement.blur();
            }
        }
    }, [ _visible ]);

    /**
     * Sets the visibility of the hangup menu.
     *
     * @param {boolean} visible - Whether or not the hangup menu should be
     * displayed.
     * @private
     * @returns {void}
     */
    const onSetHangupVisible = useCallback((visible: boolean) => {
        dispatch(setHangupMenuVisible(visible));
        dispatch(setToolbarHovered(visible));
    }, []);

    /**
     * Sets the visibility of the overflow menu.
     *
     * @param {boolean} visible - Whether or not the overflow menu should be
     * displayed.
     * @private
     * @returns {void}
     */
    const onSetOverflowVisible = useCallback((visible: boolean) => {
        visible && dispatch(setShareMenuVisible(false));
        dispatch(setOverflowMenuVisible(visible));
        dispatch(setToolbarHovered(visible));
    }, []);

    useEffect(() => {
        if (_hangupMenuVisible && !_visible) {
            onSetHangupVisible(false);
            dispatch(setToolbarHovered(false));
        }
    }, [ _hangupMenuVisible, _visible ]);

    useEffect(() => {
        if (_overflowMenuVisible && _dialog) {
            onSetOverflowVisible(false);
            dispatch(setToolbarHovered(false));
        } else if (_shareMenuVisible && _dialog) {
            dispatch(setShareMenuVisible(false));
            dispatch(setToolbarHovered(false));
        }
    }, [ _overflowMenuVisible, _dialog, _shareMenuVisible ]);

    /**
     * Key handler for overflow/hangup menus.
     *
     * @param {KeyboardEvent} e - Esc key click to close the popup.
     * @returns {void}
     */
    const onEscKey = useCallback((e?: React.KeyboardEvent) => {
        if (e?.key === 'Escape') {
            e?.stopPropagation();
            _hangupMenuVisible && dispatch(setHangupMenuVisible(false));
            _overflowMenuVisible && dispatch(setOverflowMenuVisible(false));
        }
    }, [ _hangupMenuVisible, _overflowMenuVisible ]);

    /**
     * Sets the notify click mode for the buttons.
     *
     * @param {Object} buttons - The list of toolbar buttons.
     * @returns {void}
     */
    function setButtonsNotifyClickMode(buttons: Object) {
        if (typeof APP === 'undefined' || (_buttonsWithNotifyClick?.size ?? 0) <= 0) {
            return;
        }

        Object.values(buttons).forEach((button: any) => {
            if (typeof button === 'object') {
                button.notifyMode = _buttonsWithNotifyClick.get(button.key);
            }
        });
    }

    /**
     * Returns all buttons that need to be rendered.
     *
     * @param {Object} state - The redux state.
     * @returns {Object} The visible buttons arrays .
     */
    function getVisibleButtons() {
        const buttons = getAllToolboxButtons(_customToolbarButtons);

        setButtonsNotifyClickMode(buttons);
        const isHangupVisible = isButtonEnabled('hangup', _toolbarButtons);
        const { order } = THRESHOLDS.find(({ width }) => _clientWidth > width)
            || THRESHOLDS[THRESHOLDS.length - 1];

        const keys = Object.keys(buttons);

        const filtered = [
            ...order.map(key => buttons[key]),
            ...Object.values(buttons).filter((button, index) => !order.includes(keys[index]))
        ].filter(Boolean).filter(({ key, alias = NOT_APPLICABLE }) =>
            !_jwtDisabledButtons.includes(key)
            && (isButtonEnabled(key, _toolbarButtons) || isButtonEnabled(alias, _toolbarButtons))
        );

        let sliceIndex = _overflowDrawer || _reactionsButtonEnabled ? order.length + 2 : order.length + 1;

        if (isHangupVisible) {
            sliceIndex -= 1;
        }

        // This implies that the overflow button will be displayed, so save some space for it.
        if (sliceIndex < filtered.length) {
            sliceIndex -= 1;
        }

        return {
            mainMenuButtons: filtered.slice(0, sliceIndex),
            overflowMenuButtons: filtered.slice(sliceIndex)
        };
    }

    /**
     * Dispatches an action signaling the toolbar is not being hovered.
     *
     * @private
     * @returns {void}
     */
    function onMouseOut() {
        !(_overflowMenuVisible || _shareMenuVisible) && dispatch(setToolbarHovered(false));
    }

    /**
     * Dispatches an action signaling the toolbar is being hovered.
     *
     * @private
     * @returns {void}
     */
    function onMouseOver() {
        dispatch(setToolbarHovered(true));
    }

    /**
     * Toggle the toolbar visibility when tabbing into it.
     *
     * @returns {void}
     */
    const onTabIn = useCallback(() => {
        if (!_visible) {
            dispatch(showToolbox());
        }
    }, [ _visible ]);

    /**
     * Renders the toolbox content.
     *
     * @returns {ReactElement}
     */
    function renderToolboxContent() {
        const containerClassName = `toolbox-content${_isMobile || _isNarrowLayout ? ' toolbox-content-mobile' : ''}`;

        const { mainMenuButtons, overflowMenuButtons } = getVisibleButtons();
        const raiseHandInOverflowMenu = overflowMenuButtons.some(({ key }) => key === 'raisehand');
        const showReactionsInOverflowMenu = _shouldDisplayReactionsButtons
            && (
                (!_reactionsButtonEnabled && (raiseHandInOverflowMenu || _isNarrowLayout || _isMobile))
                    || overflowMenuButtons.some(({ key }) => key === 'reactions')
            );
        const showRaiseHandInReactionsMenu = showReactionsInOverflowMenu && raiseHandInOverflowMenu;

        return (
            <div className = { containerClassName }>
                <div
                    className = 'toolbox-content-wrapper'
                    onFocus = { onTabIn }
                    { ...(_isMobile ? {} : {
                        onMouseOut,
                        onMouseOver
                    }) }>

                    <div
                        className = 'toolbox-content-items'
                        ref = { _toolboxRef }>
                        {mainMenuButtons.map(({ Content, key, ...rest }) => Content !== Separator && (
                            <Content
                                { ...rest }
                                buttonKey = { key }
                                key = { key } />))}

                        {Boolean(overflowMenuButtons.length) && (
                            <OverflowMenuButton
                                ariaControls = 'overflow-menu'
                                buttons = { overflowMenuButtons.reduce((acc, val) => {
                                    if (val.key === 'reactions' && showReactionsInOverflowMenu) {
                                        return acc;
                                    }

                                    if (val.key === 'raisehand' && showRaiseHandInReactionsMenu) {
                                        return acc;
                                    }

                                    if (acc.length) {
                                        const prev = acc[acc.length - 1];
                                        const group = prev[prev.length - 1].group;

                                        if (group === val.group) {
                                            prev.push(val);
                                        } else {
                                            acc.push([ val ]);
                                        }
                                    } else {
                                        acc.push([ val ]);
                                    }

                                    return acc;
                                }, []) }
                                isOpen = { _overflowMenuVisible }
                                key = 'overflow-menu'
                                onToolboxEscKey = { onEscKey }
                                onVisibilityChange = { onSetOverflowVisible }
                                showRaiseHandInReactionsMenu = { showRaiseHandInReactionsMenu }
                                showReactionsMenu = { showReactionsInOverflowMenu } />
                        )}

                        {isButtonEnabled('hangup', _toolbarButtons) && (
                            <HangupMenuButton
                                ariaControls = 'hangup-menu'
                                isOpen = { _hangupMenuVisible }
                                key = 'hangup-menu'
                                onVisibilityChange = { onSetHangupVisible } />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (_disabled) {
        return null;
    }

    const rootClassNames = `new-toolbox ${_visible ? 'visible' : ''} ${
        _toolbarButtons.length ? '' : 'no-buttons'} ${_chatOpen ? 'shift-right' : ''}`;

    return (
        <div
            className = { cx(rootClassNames, _shiftUp && 'shift-up') }
            id = 'new-toolbox'>
            {renderToolboxContent()}
        </div>
    );
};

/**
 * Maps (parts of) the redux state to {@link Toolbox}'s React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @param {Object} ownProps - The props explicitly passed.
 * @private
 * @returns {{}}
 */
function _mapStateToProps(state, ownProps) {
    const { conference } = state['features/base/conference'];
    const { isNarrowLayout } = state['features/base/responsive-ui'];

    const {
        customToolbarButtons,
        iAmRecorder,
        iAmSipGateway
    } = state['features/base/config'];
    const {
        hangupMenuVisible,
        overflowMenuVisible,
        overflowDrawer,
        shareMenuVisible,
    } = state['features/toolbox'];
    const { clientWidth } = state['features/base/responsive-ui'];
    const toolbarButtons = ownProps.toolbarButtons || state['features/toolbox'].toolbarButtons;

    return {
        _buttonsWithNotifyClick: state['features/toolbox'].buttonsWithNotifyClick,
        _chatOpen: state['features/chat'].isOpen,
        _clientWidth: clientWidth,
        _customToolbarButtons: customToolbarButtons,
        _dialog: Boolean(state['features/base/dialog'].component),
        _disabled: Boolean(iAmRecorder || iAmSipGateway),
        _endConferenceSupported: true, // Boolean(endConferenceSupported),
        _isLocalModerator: isLocalParticipantModerator(state),
        _isMobile: isMobileBrowser(),
        _jwtDisabledButtons: getJwtDisabledButtons(state),
        _hangupMenuVisible: hangupMenuVisible,
        _isNarrowLayout: isNarrowLayout,
        _overflowMenuVisible: overflowMenuVisible,
        _overflowDrawer: overflowDrawer,
        _participantCount: getParticipantCount(state),
        _reactionsButtonEnabled: isReactionsButtonEnabled(state),
        _shiftUp: state['features/toolbox'].shiftUp,
        _shareMenuVisible: shareMenuVisible,
        _shouldDisplayReactionsButtons: shouldDisplayReactionsButtons(state),
        _toolbarButtons: toolbarButtons,
        _visible: isToolboxVisible(state)
    };
}

export default translate(connect(_mapStateToProps)(Toolbox));
