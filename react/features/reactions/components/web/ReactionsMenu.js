// @flow

/* eslint-disable react/jsx-no-bind */

import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { createReactionMenuEvent, createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { raiseHand } from '../../../base/participants/actions';
import { getLocalParticipant, hasRaisedHand } from '../../../base/participants/functions';
import { dockToolbox } from '../../../toolbox/actions.web';
import { areKeyboardShortcutsEnabled } from '../../../keyboard-shortcuts/functions';
import { addReactionToBuffer } from '../../actions.any';
import { toggleReactionsMenuVisibility } from '../../actions.web';
import {
    RAISE_HAND_ROW_HEIGHT, REACTIONS,
    REACTIONS_MENU_HEIGHT_DRAWER,
    REACTIONS_MENU_HEIGHT_IN_OVERFLOW_MENU
} from '../../constants';
import { IReactionsMenuParent } from '../../types';

import ReactionButton from './ReactionButton';

type Props = {

    /**
     * Docks the toolbox.
     */
    _dockToolbox: Function,

    /**
     * Whether or not it's a mobile browser.
     */
    _isMobile: boolean,

    /**
     * The ID of the local participant.
     */
    _localParticipantID: String,

    /**
     * Whether or not the local participant's hand is raised.
     */
    _raisedHand: boolean,

    /**
     * The Redux Dispatch function.
     */
    dispatch: Function,

    /**
     * Indicates the parent of the reactions menu.
     */
    parent: IReactionsMenuParent;

    /**
     * Whether to show the raised hand button.
     */
    showRaisedHand?: boolean;
};

declare var APP: Object;

const useStyles = makeStyles()((theme, props) => {
    const { parent, showRaisedHand } = props;
    let reactionsMenuHeight = REACTIONS_MENU_HEIGHT_DRAWER;

    if (parent === IReactionsMenuParent.OverflowDrawer || parent === IReactionsMenuParent.OverflowMenu) {
        if (parent === IReactionsMenuParent.OverflowMenu) {
            reactionsMenuHeight = REACTIONS_MENU_HEIGHT_IN_OVERFLOW_MENU;
        }
        if (!showRaisedHand) {
            reactionsMenuHeight -= RAISE_HAND_ROW_HEIGHT;
        }
    }

    return {
        reactionsMenuInOverflowMenu: {
            '&.reactions-menu': {
                '.reactions-row': {
                    '.toolbox-icon': {
                        width: '24px',
                        height: '24px',

                        'span.emoji': {
                            width: '24px',
                            height: '24px',
                            lineHeight: '24px',
                            fontSize: '16px'
                        }
                    }
                },
                '.raise-hand-row': {
                    '.toolbox-icon': {
                        height: '32px'
                    }
                }
            }
        },
        overflow: {
            width: 'auto',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0), 16px)',
            backgroundColor: theme.palette.ui01,
            boxShadow: 'none',
            borderRadius: 0,
            position: 'relative',
            boxSizing: 'border-box',
            height: `${reactionsMenuHeight}px`
        }
    };
});

const _getReactionButtons = (dispatch, t, _enabledShortcut) => {
    let modifierKey = 'Alt';

    if (window.navigator?.platform) {
        if (window.navigator.platform.indexOf('Mac') !== -1) {
            modifierKey = '⌥';
        }
    }

    return Object.keys(REACTIONS).map(key => {
        /**
         * Sends reaction message.
         *
         * @returns {void}
         */
        function doSendReaction() {
            dispatch(addReactionToBuffer(key));
            sendAnalytics(createReactionMenuEvent(key));
        }

        const tooltip = _enabledShortcut
            ? `${t(`toolbar.${key}`)} (${modifierKey} + ${REACTIONS[key].shortcutChar})`
            : t(`toolbar.${key}`);

        return (<ReactionButton
            accessibilityLabel = { t(`toolbar.accessibilityLabel.${key}`) }
            icon = { REACTIONS[key].emoji }
            key = { key }
            // eslint-disable-next-line react/jsx-no-bind
            onClick = { doSendReaction }
            toggled = { false }
            tooltip = { tooltip } />);
    });
};

const ReactionsMenu = (props) => {
    const {
        _dockToolbox,
        _enabledShortcut,
        _raisedHand,
        dispatch,
        parent,
        showRaisedHand = false
    } = props;
    const isInOverflowMenu
        = parent === IReactionsMenuParent.OverflowDrawer || parent === IReactionsMenuParent.OverflowMenu;
    const { classes, cx } = useStyles(props);
    const { t } = useTranslation();

    useEffect(() => {
        _dockToolbox(true);

        return () => {
            _dockToolbox(false);
        };
    }, []);

    const _doToggleRaiseHand = useCallback(() => {
        dispatch(raiseHand(!_raisedHand));
    }, [ _raisedHand ]);

    const _onToolbarToggleRaiseHand = useCallback(() => {
        sendAnalytics(createToolbarEvent(
            'raise.hand',
            { enable: !_raisedHand }));
        _doToggleRaiseHand();
        dispatch(toggleReactionsMenuVisibility());
    }, [ _raisedHand ]);

    const buttons = _getReactionButtons(dispatch, t, _enabledShortcut);

    return (
        <div
            className = { cx('reactions-menu',
                parent === IReactionsMenuParent.OverflowMenu && classes.reactionsMenuInOverflowMenu,
                isInOverflowMenu && `overflow ${classes.overflow}`) }>
            <div className = 'reactions-row'>
                { buttons }
            </div>
            {showRaisedHand && (
                <div className = 'raise-hand-row'>
                    <ReactionButton
                        accessibilityLabel = { t('toolbar.accessibilityLabel.raiseHand') }
                        icon = '✋'
                        key = 'raisehand'
                        label = {
                            `${t(`toolbar.${_raisedHand ? 'lowerYourHand' : 'raiseYourHand'}`)}
                                ${isInOverflowMenu ? '' : ' (R)'}`
                        }
                        onClick = { _onToolbarToggleRaiseHand }
                        toggled = { true } />
                </div>
            )}
        </div>
    );
};

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    const localParticipant = getLocalParticipant(state);

    return {
        _enabledShortcut: areKeyboardShortcutsEnabled(state),
        _localParticipantID: localParticipant?.id,
        _raisedHand: hasRaisedHand(localParticipant)
    };
}

/**
 * Function that maps parts of Redux actions into component props.
 *
 * @param {Object} dispatch - Redux dispatch.
 * @returns {Object}
 */
function mapDispatchToProps(dispatch) {
    return {
        dispatch,
        _dockToolbox: (dock) => dispatch(dockToolbox(dock))
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(ReactionsMenu);
