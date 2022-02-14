import Range from '@atlaskit/range';
import { makeStyles } from '@material-ui/core/styles';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
    Icon,
    IconTileMax,
    IconTileMin
} from '../../../../base/icons';
import Separator from '../../../../toolbox/components/web/Separator';

const useStyles = makeStyles(theme => {
    return {
        container: {
            display: 'block',
            paddingLeft: 16,
            paddingTop: 16,

            '& h3': {
                color: 'white',
                fontSize: 16,
                fontWeight: 'bold',
                marginBottom: 10
            },

            '& p': {
                color: '#a0a0a0',
            }
        },
        control: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 16
        }
    };
});

function TileViewMaxColumnsSettings({
    tileViewMaxColumns,
    onChange
}) {
    const styles = useStyles();
    const { t } = useTranslation();

    return (
        <div className = { styles.container }>
            <h3>{ t('settings.tile', { column: tileViewMaxColumns }) }</h3>
            <p>{ t('settings.tileDescription') }</p>
            <Separator />
            <div className = { styles.control }>
                <Icon size = { 18 } src = { IconTileMin } />
                <Range
                    step = { 1 }
                    min = { 2 }
                    max = { 7 }
                    onChange = { onChange }
                    value = { tileViewMaxColumns } />
                <Icon size = { 18 } src = { IconTileMax } />
            </div>
        </div>
    )
}

export default TileViewMaxColumnsSettings;
