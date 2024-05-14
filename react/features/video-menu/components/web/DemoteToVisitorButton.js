import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { openDialog } from '../../../base/dialog/actions';
import { IconUsers } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';

import DemoteToVisitorDialog from './DemoteToVisitorDialog';

/**
 * Implements a React {@link Component} which displays a button for demoting a participant to visitor.
 *
 * @returns {JSX.Element}
 */
export default function DemoteToVisitorButton({
    className,
    noIcon = false,
    notifyClick,
    notifyMode,
    participantID
}) {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const handleClick = useCallback(() => {
        notifyClick?.();
        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }
        dispatch(openDialog(DemoteToVisitorDialog, { participantID }));
    }, [ dispatch, notifyClick, notifyMode, participantID ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { t('videothumbnail.demote') }
            className = { className || 'demotelink' } // can be used in tests
            icon = { noIcon ? null : IconUsers }
            id = { `demotelink_${participantID}` }
            onClick = { handleClick }
            text = { t('videothumbnail.demote') } />
    );
}
