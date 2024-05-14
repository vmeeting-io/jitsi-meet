import React, { Component, ReactElement } from 'react';

import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';
import { combineStyles } from '../../styles/functions.any';

import ToolboxItem from './ToolboxItem';

/**
 * Default style for disabled buttons.
 */
export const defaultDisabledButtonStyles = {
    iconStyle: {
        opacity: 0.5
    },
    labelStyle: {
        opacity: 0.5
    },
    style: undefined,
    underlayColor: undefined
};

/**
 * An abstract implementation of a button.
 */
export default class AbstractButton extends Component {
    static defaultProps = {
        afterClick: undefined,
        disabledStyles: defaultDisabledButtonStyles,
        showLabel: false,
        styles: undefined,
        toggledStyles: undefined,
        tooltipPosition: 'top',
        visible: true
    };

    /**
     * The button's background color.
     *
     * @abstract
     */
    backgroundColor;

    /**
     * A succinct description of what the button does. Used by accessibility
     * tools and torture tests.
     *
     * If `toggledAccessibilityLabel` is defined, this is used only when the
     * button is not toggled on.
     *
     * @abstract
     */
    accessibilityLabel;

    /**
     * This is the same as `accessibilityLabel`, replacing it when the button
     * is toggled on.
     *
     * @abstract
     */
    toggledAccessibilityLabel;

    labelProps;

    /**
     * The icon of this button.
     *
     * @abstract
     */
    icon;

    /**
     * The text associated with this button. When `showLabel` is set to
     * {@code true}, it will be displayed alongside the icon.
     *
     * @abstract
     */
    label;

    /**
     * The label for this button, when toggled.
     */
    toggledLabel;

    /**
     * The icon of this button, when toggled.
     *
     * @abstract
     */
    toggledIcon;

    /**
     * The text to display in the tooltip. Used only on web.
     *
     * If `toggleTooltip` is defined, this is used only when the button is not
     * toggled on.
     *
     * @abstract
     */
    tooltip;

    /**
     * The text to display in the tooltip when the button is toggled on.
     *
     * Used only on web.
     *
     * @abstract
     */
    toggledTooltip;

    /**
     * Initializes a new {@code AbstractButton} instance.
     *
     * @param {IProps} props - The React {@code Component} props to initialize
     * the new {@code AbstractButton} instance with.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Helper function to be implemented by subclasses, which should be used
     * to handle a key being down.
     *
     * @protected
     * @returns {void}
     */
    _onKeyDown() {
        // To be implemented by subclass.
    }

    /**
     * Helper function to be implemented by subclasses, which should be used
     * to handle the button being clicked / pressed.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        // To be implemented by subclass.
    }

    /**
     * Helper function to be implemented by subclasses, which may return a
     * new React Element to be appended at the end of the button.
     *
     * @protected
     * @returns {ReactElement|null}
     */
    _getElementAfter() {
        return null;
    }

    /**
     * Gets the current icon, taking the toggled state into account. If no
     * toggled icon is provided, the regular icon will also be used in the
     * toggled state.
     *
     * @private
     * @returns {string}
     */
    _getIcon() {
        return (
            this._isToggled() ? this.toggledIcon : this.icon
        ) || this.icon;
    }

    /**
     * Gets the current label, taking the toggled state into account. If no
     * toggled label is provided, the regular label will also be used in the
     * toggled state.
     *
     * @private
     * @returns {string}
     */
    _getLabel() {
        return (this._isToggled() ? this.toggledLabel : this.label)
            || this.label;
    }

    /**
     * Gets the current accessibility label, taking the toggled state into
     * account. If no toggled label is provided, the regular accessibility label
     * will also be used in the toggled state.
     *
     * The accessibility label is not visible in the UI, it is meant to be
     * used by assistive technologies, mainly screen readers.
     *
     * @private
     * @returns {string}
     */
    _getAccessibilityLabel() {
        return (this._isToggled()
            ? this.toggledAccessibilityLabel
            : this.accessibilityLabel
        ) || this.accessibilityLabel;
    }

    /**
     * Gets the current styles, taking the toggled state into account. If no
     * toggled styles are provided, the regular styles will also be used in the
     * toggled state.
     *
     * @private
     * @returns {?Styles}
     */
    _getStyles() {
        const { disabledStyles, styles, toggledStyles } = this.props;
        const buttonStyles
            = (this._isToggled() ? toggledStyles : styles) || styles;

        if (this._isDisabled() && buttonStyles && disabledStyles) {
            return {
                iconStyle: combineStyles(
                    buttonStyles.iconStyle ?? {}, disabledStyles.iconStyle ?? {}),
                labelStyle: combineStyles(
                    buttonStyles.labelStyle ?? {}, disabledStyles.labelStyle ?? {}),
                style: combineStyles(
                    buttonStyles.style ?? {}, disabledStyles.style ?? {}),
                underlayColor:
                    disabledStyles.underlayColor || buttonStyles.underlayColor
            };
        }

        return buttonStyles;
    }

    /**
     * Get the tooltip to display when hovering over the button.
     *
     * @private
     * @returns {string}
     */
    _getTooltip() {
        return (this._isToggled() ? this.toggledTooltip : this.tooltip)
            || this.tooltip
            || '';
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * boolean value indicating if this button is disabled or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return false;
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * {@code boolean} value indicating if this button is toggled or not or
     * undefined if the button is not toggleable.
     *
     * @protected
     * @returns {?boolean}
     */
    _isToggled() {
        return undefined;
    }

    /**
     * Handles clicking / pressing the button.
     *
     * @param {Object} e - Event.
     * @private
     * @returns {void}
     */
    _onClick(e) {
        const { afterClick, buttonKey, handleClick, notifyMode } = this.props;

        if (typeof APP !== 'undefined' && notifyMode) {
            APP.API.notifyToolbarButtonClicked(
                buttonKey, notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY
            );
        }

        if (notifyMode !== NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            if (handleClick) {
                handleClick();
            }

            this._handleClick(e);
        }

        afterClick?.(e);

        // blur after click to release focus from button to allow PTT.
        // @ts-ignore
        e?.currentTarget?.blur && e.currentTarget.blur();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Node}
     */
    render() {
        const props = {
            ...this.props,
            accessibilityLabel: this._getAccessibilityLabel(),
            elementAfter: this._getElementAfter(),
            icon: this._getIcon(),
            label: this._getLabel(),
            labelProps: this.labelProps,
            styles: this._getStyles(),
            toggled: this._isToggled(),
            tooltip: this._getTooltip()
        };

        return (
            <ToolboxItem
                disabled = { this._isDisabled() }
                onClick = { this._onClick }
                onKeyDown = { this._onKeyDown }
                { ...props } />
        );
    }
}
