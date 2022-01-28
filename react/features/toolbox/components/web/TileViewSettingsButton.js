// @flow

import React, { Component } from 'react';

import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n';
import { IconArrowUp } from '../../../base/icons';
import { isLocalParticipantModerator } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { ToolboxButtonWithIcon } from '../../../base/toolbox/components';
import {
    getTileViewSettingsVisibility,
    toggleTileViewSettings,
    TileViewSettingsPopup
} from '../../../settings';

import { TileViewButton } from '../../../video-layout';

type Props = {

    /**
     * External handler for click action.
     */
    handleClick: Function,

    /**
     * Click handler for the small icon. Opens tile view options.
     */
    onTileViewOptionsClick: Function,

    /**
     * Used for translation.
     */
    t: Function,

    /**
     * Flag controlling the visibility of the button.
     * TileViewSettings popup is disabled on mobile browsers.
     */
    visible: boolean,

    /**
     * Defines is popup is open.
     */
    isOpen: boolean,
};

/**
 * Button used for tile view settings.
 *
 * @returns {ReactElement}
 */
class TileViewSettingsButton extends Component<Props> {
    /**
     * Initializes a new {@code TileViewSettingsButton} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onEscClick = this._onEscClick.bind(this);
        this._onClick = this._onClick.bind(this);
    }

    _onEscClick: (KeyboardEvent) => void;

    /**
     * Click handler for the more actions entries.
     *
     * @param {KeyboardEvent} event - Esc key click to close the popup.
     * @returns {void}
     */
    _onEscClick(event) {
        if (event.key === 'Escape' && this.props.isOpen) {
            event.preventDefault();
            event.stopPropagation();
            this._onClick();
        }
    }

    _onClick: () => void;

    /**
     * Click handler for the more actions entries.
     *
     * @returns {void}
     */
    _onClick() {
        const { handleClick, onTileViewOptionsClick } = this.props;

        if (handleClick) {
            handleClick();

            return;
        }

        onTileViewOptionsClick();
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { handleClick, visible, isOpen, t } = this.props;

        return visible ? (
            <TileViewSettingsPopup>
                <ToolboxButtonWithIcon
                    ariaControls = 'tileview-settings-dialog'
                    ariaExpanded = { isOpen }
                    ariaHasPopup = { true }
                    ariaLabel = { t('toolbar.tileViewSettings') }
                    icon = { IconArrowUp }
                    iconId = 'tileview-settings-button'
                    iconTooltip = { t('toolbar.tileViewSettings') }
                    onIconClick = { this._onClick }
                    onIconKeyDown = { this._onEscClick }>
                    <TileViewButton handleClick = { handleClick } />
                </ToolboxButtonWithIcon>
            </TileViewSettingsPopup>
        ) : <TileViewButton handleClick = { handleClick } />;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    return {
        isOpen: getTileViewSettingsVisibility(state),
        visible: !isMobileBrowser() && isLocalParticipantModerator(state)
    };
}

const mapDispatchToProps = {
    onTileViewOptionsClick: toggleTileViewSettings
};

export default translate(connect(
    mapStateToProps,
    mapDispatchToProps
)(TileViewSettingsButton));
