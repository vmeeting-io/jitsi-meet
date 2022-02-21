import Range from '@atlaskit/range';
import { makeStyles } from '@material-ui/core/styles';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
    Icon,
    IconTileMax,
    IconTileMin
} from '../../../../base/icons';
import Separator from '../../../../toolbox/components/web/Separator';

const TILE_VIEW_MAX_COLUMNS = 7;
const TILE_VIEW_MIN_COLUMNS = 2;
const TILE_VIEW_STEP = 1;

const useStyles = makeStyles(theme => {
    return {
        container: {
            display: 'block',
            paddingBottom: 24,
            maxWidth: 'calc(100% - 256px)',

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
        content: {
            textAlign: 'center',
        },
        control: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 16,
            maxWidth: 400,
            margin: '0 auto'
        },
        icon: {
            cursor: 'pointer'
        }
    };
});

function TileViewMaxColumns({
    onChange,
    value
}) {
    const styles = useStyles();
    const { t } = useTranslation();
    const onChangeValue = useCallback(val => {
        const newValue = Math.min(Math.max(val, TILE_VIEW_MIN_COLUMNS), TILE_VIEW_MAX_COLUMNS);
        onChange('tileViewMaxColumns', newValue);
    }, []);

    return (
        <div className = { styles.container }>
            <h3>{ t('settings.tileViewLayout', { max: value }) }</h3>
            <p>{ t('settings.tileDescription') }</p>
            <Separator />
            <div className = { styles.content }>
                <div className = { styles.control }>
                    <Icon
                        className = { styles.icon }
                        onClick = { () => onChangeValue(value - TILE_VIEW_STEP) }
                        size = { 18 }
                        src = { IconTileMin } />
                    <Range
                        step = { TILE_VIEW_STEP }
                        min = { TILE_VIEW_MIN_COLUMNS }
                        max = { TILE_VIEW_MAX_COLUMNS }
                        onChange = { onChangeValue }
                        value = { value } />
                    <Icon
                        className = { styles.icon }
                        onClick = { () => onChangeValue(value + TILE_VIEW_STEP) }
                        size = { 18 }
                        src = { IconTileMax } />
                </div>
            </div>
        </div>
    )
}

export default TileViewMaxColumns;
