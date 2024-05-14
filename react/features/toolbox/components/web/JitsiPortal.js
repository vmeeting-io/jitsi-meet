import React, { ReactNode } from 'react';
import { makeStyles } from 'tss-react/mui';

import DialogPortal from './DialogPortal';

const useStyles = makeStyles()(theme => {
    return {
        portal: {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 351,
            borderRadius: '16px 16px 0 0',

            '&.notification-portal': {
                zIndex: 901
            },

            '&::after': {
                'content': '',
                backgroundColor: theme.palette.ui01,
                marginBottom: 'env(safe-area-inset-bottom, 0)'
            }
        }
    };
});

/**
 * Component meant to render a drawer at the bottom of the screen,
 * by creating a portal containing the component's children.
 *
 * @returns {ReactElement}
 */
function JitsiPortal({ children, className }) {
    const { classes, cx } = useStyles();

    return (
        <DialogPortal className = { cx(classes.portal, className) }>
            { children }
        </DialogPortal>
    );
}

export default JitsiPortal;
