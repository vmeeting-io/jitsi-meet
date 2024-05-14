/* eslint-disable react/jsx-no-bind */
import React, { useEffect, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import Icon from '../icons/components/Icon';
import { IconCheck, IconCopy } from '../icons/svg';
import { withPixelLineHeight } from '../styles/functions.web';
import { copyText } from '../util/copyText.web';

const useStyles = makeStyles()(theme => {
    return {
        copyButton: {
            ...withPixelLineHeight(theme.typography.bodyShortBold),
            borderRadius: theme.shape.borderRadius,
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
            width: '100%',
            boxSizing: 'border-box',
            background: theme.palette.action01,
            cursor: 'pointer',
            color: theme.palette.text01,

            '&:hover': {
                backgroundColor: theme.palette.action01Hover
            },

            '&.clicked': {
                background: theme.palette.success02
            },

            '& > div > svg': {
                fill: theme.palette.icon01
            }
        },

        content: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 292,
            marginRight: theme.spacing(3),

            '&.selected': {
                fontWeight: 600
            }
        },

        icon: {
            marginRight: theme.spacing(2)
        }
    };
});

let mounted: boolean;

/**
 * Component meant to enable users to copy the conference URL.
 *
 * @returns {React$Element<any>}
 */
function CopyButton({
    accessibilityText,
    className = '',
    displayedText,
    textToCopy,
    textOnHover,
    textOnCopySuccess,
    id
}) {
    const { classes, cx } = useStyles();
    const [ isClicked, setIsClicked ] = useState(false);
    const [ isHovered, setIsHovered ] = useState(false);

    useEffect(() => {
        mounted = true;

        return () => {
            mounted = false;
        };
    }, []);

    /**
     * Click handler for the element.
     *
     * @returns {void}
     */
    async function onClick() {
        setIsHovered(false);

        const isCopied = await copyText(textToCopy);

        if (isCopied) {
            setIsClicked(true);

            setTimeout(() => {
                // avoid: Can't perform a React state update on an unmounted component
                if (mounted) {
                    setIsClicked(false);
                }
            }, 2500);
        }
    }

    /**
     * Hover handler for the element.
     *
     * @returns {void}
     */
    function onHoverIn() {
        if (!isClicked) {
            setIsHovered(true);
        }
    }

    /**
     * Hover handler for the element.
     *
     * @returns {void}
     */
    function onHoverOut() {
        setIsHovered(false);
    }

    /**
     * KeyPress handler for accessibility.
     *
     * @param {React.KeyboardEventHandler<HTMLDivElement>} e - The key event to handle.
     *
     * @returns {void}
     */
    function onKeyPress(e: React.KeyboardEvent) {
        if (onClick && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onClick();
        }
    }

    /**
     * Renders the content of the link based on the state.
     *
     * @returns {React$Element<any>}
     */
    function renderContent() {
        if (isClicked) {
            return (
                <>
                    <Icon
                        className = { classes.icon }
                        size = { 24 }
                        src = { IconCheck } />
                    <div className = { cx(classes.content, 'selected') }>
                        <span role = { 'alert' }>{ textOnCopySuccess }</span>
                    </div>
                </>
            );
        }

        return (
            <>
                <Icon
                    className = { classes.icon }
                    size = { 24 }
                    src = { IconCopy } />
                <div className = { classes.content }>
                    <span> { isHovered ? textOnHover : displayedText } </span>
                </div>
            </>
        );
    }

    return (
        <>
            <div
                aria-describedby = { displayedText === textOnHover
                    ? undefined
                    : `${id}-sr-text` }
                aria-label = { displayedText === textOnHover ? accessibilityText : textOnHover }
                className = { cx(className, classes.copyButton, isClicked ? ' clicked' : '') }
                id = { id }
                onBlur = { onHoverOut }
                onClick = { onClick }
                onFocus = { onHoverIn }
                onKeyPress = { onKeyPress }
                onMouseOut = { onHoverOut }
                onMouseOver = { onHoverIn }
                role = 'button'
                tabIndex = { 0 }>
                { renderContent() }
            </div>

            { displayedText !== textOnHover && (
                <span
                    className = 'sr-only'
                    id = { `${id}-sr-text` }>
                    { accessibilityText }
                </span>
            )}
        </>
    );
}

export default CopyButton;
