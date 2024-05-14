import React, { useCallback } from 'react';

import Button from '../../../base/ui/components/web/Button';
import { NOTIFY_CLICK_MODE } from '../../types';


/**
 * Implementation of a button to be rendered within Hangup context menu.
 *
 * @param {Object} props - Component's props.
 * @returns {JSX.Element} - Button that would trigger the hangup action.
 */
export const HangupContextMenuItem = (props) => {
    const shouldNotify = props.notifyMode !== undefined;
    const shouldPreventExecution = props.notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY;

    const _onClick = useCallback((e) => {
        if (shouldNotify) {
            APP.API.notifyToolbarButtonClicked(props.buttonKey, shouldPreventExecution);
        }

        if (!shouldPreventExecution) {
            props.onClick(e);
        }
    }, []);

    return (
        <Button
            accessibilityLabel = { props.accessibilityLabel }
            fullWidth = { true }
            label = { props.label }
            onClick = { _onClick }
            type = { props.buttonType } />
    );
};

