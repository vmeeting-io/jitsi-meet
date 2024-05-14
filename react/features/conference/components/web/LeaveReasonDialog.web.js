import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import Dialog from '../../../base/ui/components/web/Dialog';

const useStyles = makeStyles()(theme => {
    return {
        dialog: {
            marginBottom: theme.spacing(1)
        },

        text: {
            fontSize: '20px'
        }
    };
});

/**
 * A React {@code Component} for displaying a dialog with a reason that ended the conference.
 *
 * @param {IProps} props - Component's props.
 * @returns {JSX}
 */
const LeaveReasonDialog = ({ onClose, title }) => {
    const { classes } = useStyles();
    const { t } = useTranslation();

    useEffect(() => () => {
        onClose?.();
    }, []);

    return (
        <Dialog
            cancel = {{ hidden: true }}
            onSubmit = { onClose }
            size = 'medium'
            testId = 'dialog.leaveReason'>
            <div className = { classes.dialog }>
                {title ? <div className = { classes.text }>{t(title)}</div> : null}
            </div>
        </Dialog>
    );
};

export default LeaveReasonDialog;
