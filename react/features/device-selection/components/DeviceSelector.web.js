import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../base/styles/functions.web';
import Select from '../../base/ui/components/web/Select';

const useStyles = makeStyles()(theme => {
    return {
        textSelector: {
            width: '100%',
            boxSizing: 'border-box',
            borderRadius: theme.shape.borderRadius,
            backgroundColor: theme.palette.uiBackground,
            padding: '10px 16px',
            textAlign: 'center',
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            border: `1px solid ${theme.palette.ui03}`
        }
    };
});

const DeviceSelector = ({
    devices,
    hasPermission,
    id,
    isDisabled,
    label,
    onSelect,
    selectedDeviceId
}) => {
    const { classes } = useStyles();
    const { t } = useTranslation();

    const _onSelect = useCallback((e) => {
        const deviceId = e.target.value;

        if (selectedDeviceId !== deviceId) {
            onSelect(deviceId);
        }
    }, [ selectedDeviceId, onSelect ]);

    const _createDropdown = (options) => {
        const triggerText
            = (options.defaultSelected && (options.defaultSelected.label || options.defaultSelected.deviceId))
            || options.placeholder;

        if (options.isDisabled || !options.items?.length) {
            return (
                <div className = { classes.textSelector }>
                    {triggerText}
                </div>
            );
        }

        return (
            <Select
                id = { id }
                label = { t(label) }
                onChange = { _onSelect }
                options = { options.items }
                value = { selectedDeviceId } />
        );
    };

    const _renderNoDevices = () => _createDropdown({
        isDisabled: true,
        placeholder: t('settings.noDevice')
    });

    const _renderNoPermission = () => _createDropdown({
        isDisabled: true,
        placeholder: t('deviceSelection.noPermission')
    });

    if (hasPermission === undefined) {
        return null;
    }

    if (!hasPermission) {
        return _renderNoPermission();
    }

    if (!devices?.length) {
        return _renderNoDevices();
    }

    const items = devices.map(device => {
        return {
            value: device.deviceId,
            label: device.label || device.deviceId
        };
    });
    const defaultSelected = devices.find(item =>
        item.deviceId === selectedDeviceId
    );

    return _createDropdown({
        defaultSelected,
        isDisabled,
        items,
        placeholder: t('deviceSelection.selectADevice')
    });
};

export default DeviceSelector;
