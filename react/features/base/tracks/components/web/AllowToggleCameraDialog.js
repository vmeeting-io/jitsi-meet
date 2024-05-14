import React from 'react';
import { useSelector } from 'react-redux';

import { translate } from '../../../i18n/functions';
import { getParticipantDisplayName } from '../../../participants/functions';
import Dialog from '../../../ui/components/web/Dialog';


/**
 * Dialog to allow toggling camera remotely.
 *
 * @returns {JSX.Element} - The allow toggle camera dialog.
 */
const AllowToggleCameraDialog = ({ onAllow, t, initiatorId }) => {
    const initiatorName = useSelector((state) => getParticipantDisplayName(state, initiatorId));

    return (
        <Dialog
            ok = {{ translationKey: 'dialog.allow' }}
            onSubmit = { onAllow }
            titleKey = 'dialog.allowToggleCameraTitle'>
            <div>
                { t('dialog.allowToggleCameraDialog', { initiatorName }) }
            </div>
        </Dialog>
    );
};

export default translate(AllowToggleCameraDialog);
