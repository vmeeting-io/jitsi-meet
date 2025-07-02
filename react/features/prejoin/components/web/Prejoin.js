// @flow

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { Button as AntButton, Dropdown } from 'antd';
import styled from 'styled-components';
import { map, sortBy } from 'lodash';
import moment from 'moment';
import timezones from './timezones.json';

import { conferences } from '../../../../api/conferences';

import Avatar from '../../../base/avatar/components/Avatar';
import {
    setRoomInfo as setRoomInfoAction
} from '../../../base/conference/actions';
import { isNameReadOnly } from '../../../base/config/functions.web';
import { IconArrowDown, IconArrowUp, IconPhoneRinging, IconVolumeOff } from '../../../base/icons/svg';
import { isVideoMutedByUser } from '../../../base/media/functions';
import { getLocalParticipant } from '../../../base/participants/functions';
import Popover from '../../../base/popover/components/Popover.web';
import ActionButton from '../../../base/premeeting/components/web/ActionButton';
import PreMeetingScreen from '../../../base/premeeting/components/web/PreMeetingScreen';
import { updateSettings } from '../../../base/settings/actions';
import { getDisplayName } from '../../../base/settings/functions.web';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { getLocalJitsiVideoTrack } from '../../../base/tracks/functions.web';
import Button from '../../../base/ui/components/web/Button';
import Input from '../../../base/ui/components/web/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import isInsecureRoomName from '../../../base/util/isInsecureRoomName';
import { openDisplayNamePrompt } from '../../../display-name/actions';
import { isUnsafeRoomWarningEnabled } from '../../../prejoin/functions';
import Icon from '../../../base/icons/components/Icon';
import { updateTimezone } from '../../../../api/AuthApi';
import { setJWT } from '../../../base/jwt/actions';
import { setTimezone } from '../../../timezone/actions';

import {
    joinConference as joinConferenceAction,
    joinConferenceWithoutAudio as joinConferenceWithoutAudioAction,
    setJoinByPhoneDialogVisiblity as setJoinByPhoneDialogVisiblityAction
} from '../../actions.web';
import {
    isDeviceStatusVisible,
    isDisplayNameRequired,
    isJoinByPhoneButtonVisible,
    isJoinByPhoneDialogVisible,
    isPrejoinDisplayNameVisible
} from '../../functions';
import { hasDisplayName } from '../../utils';

import JoinByPhoneDialog from './dialogs/JoinByPhoneDialog';
import Text from './Text';

type Props = {

    /**
     * Flag signaling if the device status is visible or not.
     */
    deviceStatusVisible: boolean,

    /**
     * If join by phone button should be visible.
     */
    hasJoinByPhoneButton: boolean,

    /**
     * Flag signaling if the display name is visible or not.
     */
    isDisplayNameVisible: boolean,

    /**
     * Joins the current meeting.
     */
    joinConference: Function,

    /**
     * Joins the current meeting without audio.
     */
    joinConferenceWithoutAudio: Function,

    /**
     * Whether conference join is in progress.
     */
    joiningInProgress?: boolean,

    /**
     * The name of the user that is about to join.
     */
    name: string,

    /**
     * Local participant id.
     */
    participantId?: string,

    /**
     * The prejoin config.
     */
    prejoinConfig?: Object,

    /**
     * Whether the name input should be read only or not.
     */
    readOnlyName: boolean,

    /**
     * Sets visibility of the 'JoinByPhoneDialog'.
     */
    setJoinByPhoneDialogVisiblity: Function,

    /**
     * Flag signaling the visibility of camera preview.
     */
    showCameraPreview: boolean,

    /**
     * If 'JoinByPhoneDialog' is visible or not.
     */
    showDialog: boolean,

    /**
     * If should show an error when joining without a name.
     */
    showErrorOnJoin: boolean,

    /**
     * If the recording warning is visible or not.
     */
    showRecordingWarning: boolean,

    /**
     * If should show unsafe room warning when joining.
     */
    showUnsafeRoomWarning: boolean,

    /**
     * Whether the user has approved to join a room with unsafe name.
     */
    unsafeRoomConsent?: boolean,

    /**
     * Updates settings.
     */
    updateSettings: Function,

    /**
     * The JitsiLocalTrack to display.
     */
    videoTrack: ?Object
};

const useStyles = makeStyles()(theme => {
    return {
        inputContainer: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: theme.spacing(3)
        },

        input: {
            width: '100%',

            '& input': {
                textAlign: 'center'
            }
        },

        avatarContainer: {
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column'
        },

        avatar: {
            margin: `${theme.spacing(2)} auto ${theme.spacing(3)}`
        },

        avatarName: {
            ...withPixelLineHeight(theme.typography.bodyShortBoldLarge),
            color: theme.palette.text01,
            marginBottom: theme.spacing(5),
            textAlign: 'center'
        },

        error: {
            backgroundColor: theme.palette.actionDanger,
            color: theme.palette.text01,
            borderRadius: theme.shape.borderRadius,
            width: '100%',
            ...withPixelLineHeight(theme.typography.labelRegular),
            boxSizing: 'border-box',
            padding: theme.spacing(1),
            textAlign: 'center',
            marginTop: `-${theme.spacing(2)}`,
            marginBottom: theme.spacing(3)
        },

        dropdownContainer: {
            position: 'relative',
            width: '100%'
        },

        dropdownButtons: {
            width: '300px',
            padding: '8px 0',
            backgroundColor: theme.palette.action02,
            color: theme.palette.text04,
            borderRadius: theme.shape.borderRadius,
            position: 'relative',
            top: `-${theme.spacing(3)}`,

            '@media (max-width: 511px)': {
                margin: '0 auto',
                top: 0
            },

            '@media (max-width: 420px)': {
                top: 0,
                width: 'calc(100% - 32px)'
            }
        },

        dropdownOverlay: {
            maxHeight: 300,
            backgroundColor: theme.palette.action02,
            color: theme.palette.text04,
            overflow: 'hidden',
            overflowY: 'auto',
            width: 265,
            backgroundColor: '#E0E0E0',
            borderRadius: theme.shape.borderRadius,
        },

        icon: {
            position: 'absolute',
            right: 6,
            top: 8
        }
    };
});

const StyledButton = styled(AntButton)`
    position: relative;
    width: 100%;
    background-color: #0056E0;
    color: white;
    border-radius: 6px;
    height: 38px;
    border: none;

    &:hover {
        background-color: #246FE5;
        color: white;
    }
`;

const Flex = styled.div`
    display: flex;
    flex-direction: ${props => props.direction || 'row'};
    align-items: ${props => props.align || 'start'};
    justify-content: ${props => props.justify || 'start'};
    gap: ${props => props.gap || '0px'};
`;

const Prejoin = ({
    authUser,
    deviceStatusVisible,
    hasJoinByPhoneButton,
    isDisplayNameVisible,
    joinConference,
    joinConferenceWithoutAudio,
    joiningInProgress,
    name,
    participantId,
    passwordRequired,
    prejoinConfig,
    readOnlyName,
    roomInfo,
    setJoinByPhoneDialogVisiblity,
    setRoomInfo,
    showCameraPreview,
    showDialog,
    showErrorOnJoin,
    showRecordingWarning,
    showUnsafeRoomWarning,
    timezone,
    useTimezone,
    unsafeRoomConsent,
    updateSettings: dispatchUpdateSettings,
    videoTrack
}) => {
    const showDisplayNameField = useMemo(
        () => isDisplayNameVisible && !readOnlyName,
        [ isDisplayNameVisible, readOnlyName ]);
    const [ showErrorOnField, setShowErrorOnField ] = useState(false);
    const [ showJoinByPhoneButtons, setShowJoinByPhoneButtons ] = useState(false);
    const [ inputPassword, setInputPassword ] = useState('');
    const [ timezoneItems, setTimezoneItems ] = useState([]);
    const [ selectedTimezone, setSelectedTimezone ] = useState();
    const [ dropdownVisible, setDropdownVisible ] = useState(false);

    const { classes } = useStyles();
    const { t, ready } = useTranslation();
    const dispatch = useDispatch();

    useEffect(() => {
        if (!ready) return;

        window.addEventListener('beforeunload', beforeUnloadHandler);

        if (useTimezone) {
            const timezoneItems = map(sortBy(timezones, tz => t(tz.country, { ns: 'country', keySeparator: '#' })), tz => ({
                key: `${tz.country}_${tz.utc}`,
                label: (
                    <Flex direction = 'column'>
                        <Text ellipsis style={{ maxWidth: 265 }}>{`${tz.utc} ${t(tz.country, { ns: 'country', keySeparator: '#' })}`}</Text>
                        <Text ellipsis size={12} lineHeight={1} color='#aaa' style={{ maxWidth: 265 }}>{t(tz.description, { ns: 'timezone-cities', keySeparator: '#' })}</Text>
                    </Flex>
                ),
            }));
            setTimezoneItems(timezoneItems);
            if (timezone) {
                const tz = timezones.find(tz => tz.country === timezone.country && tz.description === timezone.description);
                setSelectedTimezone(tz);
            } else {
                const pcTimezoneOffset = moment().utcOffset();
                const tz = timezones.filter(tz => {
                    const parsed = /^\(GMT(.)(\d+):(\d+)\)$/.exec(tz.utc);
                    if (!parsed) {
                        return false;
                    }
                
                    const [ _, sign, hour, minute ] = parsed;
                    const offset = (sign === '+' ? 1 : -1) * (parseInt(hour) * 60 + parseInt(minute));
                    return offset === pcTimezoneOffset;
                });

                if (tz.length === 1) {
                    // UTC 타임존이 하나일 경우, 바로 설정
                    dispatch(setTimezone(tz[0]));
                } else {
                    // 여러개일 경우, 도시 정보를 검색하여 타임존 설정
                    let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    const city = timeZone.split('/').pop();
                    const pattern = new RegExp(city, 'i');
                    timeZone = tz.find(tz => pattern.test(tz.description));
                    if (timeZone) {
                        dispatch(setTimezone(timeZone));
                    } else {
                        dispatch(setTimezone(tz[0]));
                    }
                }
            }
        }

        return () => {
            window.removeEventListener('beforeunload', beforeUnloadHandler);
        }
    }, [t, ready, timezone])

    useEffect(() => {
        if (dropdownVisible) {
            const selectedItem = document.querySelector(`.ant-dropdown-menu-item-selected`);
            console.log('selectedItem', selectedItem);
            selectedItem?.scrollIntoView({ block: 'nearest', inline: 'center' });
        }
    }, [dropdownVisible]);

    // should remove conference
    const beforeUnloadHandler = () => {
        if (authUser?.email === roomInfo?.mail_owner && roomInfo?._id) {
            conferences().id(roomInfo._id).delete();
        }
    };

    /**
     * Handler for the join button.
     *
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    const onJoinButtonClick = () => {
        if (showErrorOnJoin) {
            setShowErrorOnField('prejoin.errorMissingName');

            return;
        }

        setShowErrorOnField(false);
        checkAndJoinConference();
    };

    /**
     * Closes the dropdown.
     *
     * @returns {void}
     */
    const onDropdownClose = () => {
        setShowJoinByPhoneButtons(false);
    };

    /**
     * Displays the join by phone buttons dropdown.
     *
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    const onOptionsClick = (e) => {
        e?.stopPropagation();

        setShowJoinByPhoneButtons(show => !show);
    };

    /**
     * Sets the guest participant name.
     *
     * @param {string} displayName - Participant name.
     * @returns {void}
     */
    const setName = (displayName) => {
        if (displayName.trim().length) {
            setShowErrorOnField(false);
        }

        dispatchUpdateSettings({
            displayName
        });
    };

    const setPassword = (inputPassword) => {
        setInputPassword(inputPassword);
    };

    /**
     * Closes the join by phone dialog.
     *
     * @returns {undefined}
     */
    const closeDialog = () => {
        setJoinByPhoneDialogVisiblity(false);
    };

    /**
     * Displays the dialog for joining a meeting by phone.
     *
     * @returns {undefined}
     */
    const doShowDialog = () => {
        setJoinByPhoneDialogVisiblity(true);
        onDropdownClose();
    };

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    const showDialogKeyPress = (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            doShowDialog();
        }
    };

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    const onJoinConferenceWithoutAudioKeyPress = (e) => {
        if (joinConferenceWithoutAudio
            && (e.key === ' '
                || e.key === 'Enter')) {
            e.preventDefault();
            checkAndJoinConference(false);
        }
    };

    /**
     * Gets the list of extra join buttons.
     *
     * @returns {Object} - The list of extra buttons.
     */
    const getExtraJoinButtons = () => {
        const noAudio = {
            key: 'no-audio',
            testId: 'prejoin.joinWithoutAudio',
            icon: IconVolumeOff,
            label: t('prejoin.joinWithoutAudio'),
            onClick: joinConferenceWithoutAudio,
            onKeyPress: onJoinConferenceWithoutAudioKeyPress
        };

        const byPhone = {
            key: 'by-phone',
            testId: 'prejoin.joinByPhone',
            icon: IconPhoneRinging,
            label: t('prejoin.joinAudioByPhone'),
            onClick: doShowDialog,
            onKeyPress: showDialogKeyPress
        };

        return {
            noAudio,
            byPhone
        };
    };

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    const onJoinKeyPress = (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onJoinButtonClick();
        }
    };

    const checkAndJoinConference = (withoutAudio) => {
        if (!roomInfo?._id) {
            if (withoutAudio) {
                joinConferenceWithoutAudio({ password: inputPassword });
            } else {
                joinConference({ password: inputPassword });
            }
            return;
        }

        if (!roomInfo?.isHost && passwordRequired) {
            conferences()
                .id(roomInfo._id)
                .checkPassword(inputPassword)
                .then(resp => {
                    console.log('checkPassword response:', resp.data);
                    setShowErrorOnField(false);
                    if (withoutAudio) {
                        joinConferenceWithoutAudio({ password: inputPassword });
                    } else {
                        joinConference({ password: inputPassword });
                    }
                })
                .catch(resp => {
                    if (resp.response.status === 406) {
                        setShowErrorOnField('dialog.passwordNotMatch');
                    }
                    console.error('checkPassword is failed:', resp.response.status, resp.response.data);
                });
        } else {
            if (roomInfo?.isHost) {
                conferences()
                    .id(roomInfo._id)
                    .update({ password: inputPassword });
                setRoomInfo({ ...roomInfo, password: inputPassword });
                setShowErrorOnField(false);
            }
            if (withoutAudio) {
                joinConferenceWithoutAudio({ password: inputPassword });
            } else {
                joinConference({ password: inputPassword });
            }
        }
    }

    const onClickTimezone = async ({ key }) => {
        const [ country, utc ] = key.split('_');
        const tz = timezones.find(tz => tz.country === country && tz.utc === utc);
        if (tz) {
            if (authUser) {
                const { data: token } = await updateTimezone(tz);
                dispatch(setJWT(token));
            } else {
                dispatch(setTimezone(tz));
            }
        }
    }

    const onDropdownOpenChange = (open) => {
        setDropdownVisible(open);
    }

    const extraJoinButtons = getExtraJoinButtons();
    let extraButtonsToRender = Object.values(extraJoinButtons).filter((val: Object) =>
        !(prejoinConfig?.hideExtraJoinButtons || []).includes(val.key)
    );

    if (!hasJoinByPhoneButton) {
        extraButtonsToRender = extraButtonsToRender.filter((btn: any) => btn.key !== 'by-phone');
    }
    const hasExtraJoinButtons = Boolean(extraButtonsToRender.length);

    return (
        <PreMeetingScreen
            showDeviceStatus = { deviceStatusVisible }
            showRecordingWarning = { showRecordingWarning }
            showUnsafeRoomWarning = { showUnsafeRoomWarning }
            title = { t('prejoin.joinMeeting') }
            videoMuted = { !showCameraPreview }
            videoTrack = { videoTrack }>
            <div
                className = { classes.inputContainer }
                data-testid = 'prejoin.screen'>
                {showDisplayNameField ? (<Input
                    accessibilityLabel = { t('dialog.enterDisplayName') }
                    autoComplete = { 'name' }
                    autoFocus = { true }
                    className = { classes.input }
                    error = { showErrorOnField }
                    id = 'premeeting-name-input'
                    onChange = { setName }
                    placeholder = { t('dialog.enterDisplayName') }
                    readOnly = { readOnlyName }
                    value = { name } />
                ) : (
                    <div className = { classes.avatarContainer }>
                        <Avatar
                            className = { classes.avatar }
                            displayName = { name }
                            participantId = { participantId }
                            size = { 72 } />
                        {isDisplayNameVisible && <div className = { classes.avatarName }>{name}</div>}
                    </div>
                )}

                {passwordRequired && <Input
                    accessibilityLabel = { t('dialog.enterPassword') }
                    className = { classes.input }
                    id = 'premeeting-password-input'
                    onChange = { setPassword }
                    placeHolder = { t('lobby.enterPasswordButton') }
                    type = 'password'
                    value = { inputPassword } />}

                {showErrorOnField && <div
                    className = { classes.error }
                    data-testid = 'prejoin.errorMessage'>{t(showErrorOnField)}</div>}

                {useTimezone && (
                    <div className = { classes.dropdownContainer }>
                        <Dropdown
                            menu = {{ items: timezoneItems, onClick: onClickTimezone, selectedKeys: selectedTimezone ? [`${selectedTimezone.country}_${selectedTimezone.utc}`] : [] }}
                            trigger = {['click']}
                            overlayClassName = { classes.dropdownOverlay }
                            onOpenChange = { onDropdownOpenChange }
                        >
                            <StyledButton>
                                <Text ellipsis style={{ maxWidth: 240 }}>
                                    { timezone ? `${timezone.utc} ${t(timezone.country, { ns: 'country', keySeparator: '#' })}` : '타임존' }
                                </Text>
                                <Icon
                                    className = { classes.icon }
                                    size = { 24 }
                                    src = { IconArrowDown } />
                            </StyledButton>
                        </Dropdown>
                    </div>
                )}

                <div className = { classes.dropdownContainer }>
                    <Popover
                        content = { hasExtraJoinButtons && <div className = { classes.dropdownButtons }>
                            {extraButtonsToRender.map(({ key, ...rest }) => (
                                <Button
                                    disabled = { joiningInProgress }
                                    fullWidth = { true }
                                    key = { key }
                                    type = { BUTTON_TYPES.SECONDARY }
                                    { ...rest } />
                            ))}
                        </div> }
                        onPopoverClose = { onDropdownClose }
                        position = 'bottom'
                        trigger = 'click'
                        visible = { showJoinByPhoneButtons }>
                        <ActionButton
                            OptionsIcon = { showJoinByPhoneButtons ? IconArrowUp : IconArrowDown }
                            ariaDropDownLabel = { t('prejoin.joinWithoutAudio') }
                            ariaLabel = { t('prejoin.joinMeeting') }
                            ariaPressed = { showJoinByPhoneButtons }
                            disabled = { joiningInProgress
                                || (showUnsafeRoomWarning && !unsafeRoomConsent) }
                            hasOptions = { hasExtraJoinButtons }
                            onClick = { onJoinButtonClick }
                            onKeyPress = { onJoinKeyPress }
                            onOptionsClick = { onOptionsClick }
                            role = 'button'
                            tabIndex = { 0 }
                            testId = 'prejoin.joinMeeting'
                            type = 'primary'>
                            {t('prejoin.joinMeeting')}
                        </ActionButton>
                    </Popover>
                </div>
            </div>
            {showDialog && (
                <JoinByPhoneDialog
                    joinConferenceWithoutAudio = { joinConferenceWithoutAudio }
                    onClose = { closeDialog } />
            )}
        </PreMeetingScreen>
    );
};


/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function mapStateToProps(state): Object {
    const name = getDisplayName(state);
    const showErrorOnJoin = isDisplayNameRequired(state) && !name;
    const { id: participantId } = getLocalParticipant(state) ?? {};
    const { joiningInProgress } = state['features/prejoin'];
    const { room } = state['features/base/conference'];
    const { unsafeRoomConsent } = state['features/base/premeeting'];
    const { showPrejoinWarning: showRecordingWarning } = state['features/base/config'].recordings ?? {};
    const { timezone } = state['features/timezone'];
    const { useTimezone } = state['features/base/config'];

    return {
        authUser: state['features/base/jwt'].user ?? {},
        deviceStatusVisible: isDeviceStatusVisible(state),
        hasJoinByPhoneButton: isJoinByPhoneButtonVisible(state),
        isDisplayNameVisible: isPrejoinDisplayNameVisible(state),
        joiningInProgress,
        name,
        participantId,
        prejoinConfig: state['features/base/config'].prejoinConfig,
        readOnlyName: isNameReadOnly(state),
        passwordRequired: Boolean(state['features/base/config'].passwordRequired ?? false),
        roomInfo: state['features/base/conference'].roomInfo,
        showCameraPreview: !isVideoMutedByUser(state),
        showDialog: isJoinByPhoneDialogVisible(state),
        showErrorOnJoin,
        showRecordingWarning: Boolean(showRecordingWarning),
        showUnsafeRoomWarning: isInsecureRoomName(room) && isUnsafeRoomWarningEnabled(state),
        timezone,
        useTimezone,
        unsafeRoomConsent,
        videoTrack: getLocalJitsiVideoTrack(state)
    };
}

const mapDispatchToProps = {
    joinConferenceWithoutAudio: joinConferenceWithoutAudioAction,
    joinConference: joinConferenceAction,
    setJoinByPhoneDialogVisiblity: setJoinByPhoneDialogVisiblityAction,
    setRoomInfo: setRoomInfoAction,
    updateSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(Prejoin);
