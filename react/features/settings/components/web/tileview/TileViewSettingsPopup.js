// @flow

import InlineDialog from '@atlaskit/inline-dialog';
import { withStyles } from '@material-ui/core/styles';
import React, { Fragment } from 'react';

import { connect } from '../../../../base/redux';
import { translate } from '../../../../base/i18n';
import Separator from '../../../../toolbox/components/web/Separator';
import { toggleTileViewSettings } from '../../../actions';
import { getTileViewSettingsVisibility } from '../../../functions';

import PinParticipantsButton from './PinParticipantsButton';

type Props = {

    /**
     * Component children (the Video button).
     */
    children: React$Node,

    /**
     * Flag controlling the visibility of the popup.
     */
    isOpen: boolean,

    /**
     * Callback executed when the popup closes.
     */
    onClose: Function,

    /**
     * The popup placement enum value.
     */
    popupPlacement: string
}

const styles = theme => {
    return {
        tileViewMenu: {
            fontSize: 14,
            listStyleType: 'none',
            padding: '8px 0',
            backgroundColor: theme.palette.ui03
        },
    };
};

const menuButtons = [
    {
        key: 'pin-participants',
        Content: PinParticipantsButton,
        group: 0
    },
];

/**
 * Popup with a preview of all the video devices.
 *
 * @returns {ReactElement}
 */
function TileViewSettingsPopup({
    children,
    classes,
    isOpen,
    onClose,
    t
}: Props) {
    const content = <ul
        aria-label = { t('toolbar.accessibility.tileViewSettingsMenu') }
        className = { classes.tileViewMenu }
        id = 'tileview-settings-menu'
        role = 'menu'>
        {menuButtons.map(({ group, key, Content, ...rest }, index, arr) => {
            const showSeparator = index > 0 && arr[index - 1].group !== group;

            return <Fragment key = { `f${key}` }>
                {showSeparator && <Separator key = { `hr${group}` } />}
                <Content
                    { ...rest }
                    key = { key }
                    showLabel = { true } />
            </Fragment>;
        })}
    </ul>;

    return (
        <div className = 'tileview-settings-popup'>
            <InlineDialog
                content = { content }
                isOpen = { isOpen }
                onClose = { onClose }
                placement = 'top-end'>
                {children}
            </InlineDialog>
        </div>
    );
}

/**
 * Maps (parts of) the redux state to the associated {@code VideoSettingsPopup}'s
 * props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    return {
        isOpen: getTileViewSettingsVisibility(state),
    };
}

const mapDispatchToProps = {
    onClose: toggleTileViewSettings,
};

export default translate(connect(
    mapStateToProps,
    mapDispatchToProps
)(withStyles(styles)(TileViewSettingsPopup)));
