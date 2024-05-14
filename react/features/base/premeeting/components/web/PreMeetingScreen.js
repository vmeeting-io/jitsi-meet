import clsx from 'clsx';
import React from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import DeviceStatus from '../../../../prejoin/components/web/preview/DeviceStatus';
import { isRoomNameEnabled } from '../../../../prejoin/functions';
import Toolbox from '../../../../toolbox/components/web/Toolbox';
import { isButtonEnabled } from '../../../../toolbox/functions.web';
import { getConferenceName } from '../../../conference/functions';
import { PREMEETING_BUTTONS, THIRD_PARTY_PREJOIN_BUTTONS } from '../../../config/constants';
import { withPixelLineHeight } from '../../../styles/functions.web';

import ConnectionStatus from './ConnectionStatus';
import Preview from './Preview';
import RecordingWarning from './RecordingWarning';
import UnsafeRoomWarning from './UnsafeRoomWarning';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            height: '100%',
            position: 'absolute',
            inset: '0 0 0 0',
            display: 'flex',
            backgroundColor: theme.palette.ui01,
            zIndex: 252,

            '@media (max-width: 720px)': {
                flexDirection: 'column-reverse'
            }
        },
        content: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flexShrink: 0,
            boxSizing: 'border-box',
            margin: '0 48px',
            padding: '24px 0 16px',
            position: 'relative',
            width: '300px',
            height: '100%',
            zIndex: 252,

            '@media (max-width: 720px)': {
                height: 'auto',
                margin: '0 auto'
            },

            // mobile phone landscape
            '@media (max-width: 420px)': {
                padding: '16px 16px 0 16px',
                width: '100%'
            },

            '@media (max-width: 400px)': {
                padding: '16px'
            }
        },
        contentControls: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: 'auto',
            width: '100%'
        },
        title: {
            ...withPixelLineHeight(theme.typography.heading4),
            color: `${theme.palette.text01}!important`,
            marginBottom: theme.spacing(3),
            textAlign: 'center',

            '@media (max-width: 400px)': {
                display: 'none'
            }
        },
        roomName: {
            ...withPixelLineHeight(theme.typography.heading5),
            color: theme.palette.text01,
            marginBottom: theme.spacing(4),
            overflow: 'hidden',
            textAlign: 'center',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
        }
    };
});

const PreMeetingScreen = ({
    _buttons,
    _premeetingBackground,
    _roomName,
    children,
    className,
    showDeviceStatus,
    showRecordingWarning,
    showUnsafeRoomWarning,
    skipPrejoinButton,
    title,
    videoMuted,
    videoTrack
}) => {
    const { classes } = useStyles();
    const style = _premeetingBackground ? {
        background: _premeetingBackground,
        backgroundPosition: 'center',
        backgroundSize: 'cover'
    } : {};

    return (
        <div className = { clsx('premeeting-screen', classes.container, className) }>
            <div style = { style }>
                <div className = { classes.content }>
                    <ConnectionStatus />

                    <div className = { classes.contentControls }>
                        <h1 className = { classes.title }>
                            {title}
                        </h1>
                        {_roomName && (
                            <span className = { classes.roomName }>
                                {_roomName}
                            </span>
                        )}
                        {children}
                        {_buttons.length && <Toolbox toolbarButtons = { _buttons } />}
                        {skipPrejoinButton}
                        {showUnsafeRoomWarning && <UnsafeRoomWarning />}
                        {showDeviceStatus && <DeviceStatus />}
                        {showRecordingWarning && <RecordingWarning />}
                    </div>
                </div>
            </div>
            <Preview
                videoMuted = { videoMuted }
                videoTrack = { videoTrack } />
        </div>
    );
};


/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The props passed to the component.
 * @returns {Object}
 */
function mapStateToProps(state, ownProps) {
    const { hiddenPremeetingButtons } = state['features/base/config'];
    const { toolbarButtons } = state['features/toolbox'];
    const premeetingButtons = (ownProps.thirdParty
        ? THIRD_PARTY_PREJOIN_BUTTONS
        : PREMEETING_BUTTONS).filter((b) => !(hiddenPremeetingButtons || []).includes(b));

    const { premeetingBackground } = state['features/dynamic-branding'];

    return {
        // For keeping backwards compat.: if we pass an empty hiddenPremeetingButtons
        // array through external api, we have all prejoin buttons present on premeeting
        // screen regardless of passed values into toolbarButtons config overwrite.
        // If hiddenPremeetingButtons is missing, we hide the buttons according to
        // toolbarButtons config overwrite.
        _buttons: hiddenPremeetingButtons
            ? premeetingButtons
            : premeetingButtons.filter(b => isButtonEnabled(b, toolbarButtons)),
        _premeetingBackground: premeetingBackground,
        _roomName: isRoomNameEnabled(state) ? getConferenceName(state) : ''
    };
}

export default connect(mapStateToProps)(PreMeetingScreen);
