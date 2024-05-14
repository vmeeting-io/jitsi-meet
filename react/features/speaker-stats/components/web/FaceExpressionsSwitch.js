import { Theme } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Switch from '../../../base/ui/components/web/Switch';

const useStyles = makeStyles()((theme: Theme) => {
    return {
        switchContainer: {
            display: 'flex',
            alignItems: 'center'
        },

        switchLabel: {
            marginRight: 10,
            ...withPixelLineHeight(theme.typography.bodyShortRegular)
        }
    };
});

/**
 * React component for toggling face expressions grid.
 *
 * @returns {React$Element<any>}
 */
export default function FaceExpressionsSwitch({ onChange, showFaceExpressions }) {
    const { classes } = useStyles();
    const { t } = useTranslation();

    return (
        <div className = { classes.switchContainer } >
            <label
                className = { classes.switchLabel }
                htmlFor = 'face-expressions-switch'>
                { t('speakerStats.displayEmotions')}
            </label>
            <Switch
                checked = { showFaceExpressions }
                id = 'face-expressions-switch'
                onChange = { onChange } />
        </div>
    );
}
