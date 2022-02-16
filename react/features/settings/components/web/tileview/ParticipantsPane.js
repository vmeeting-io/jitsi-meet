import Button from '@atlaskit/button/standard-button';
import { Checkbox } from '@atlaskit/checkbox';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import Separator from '../../../../toolbox/components/web/Separator';
import { getParticipantName } from './utils';

const useStyles = makeStyles(theme => {
    return {
        container: {
            width: '240px',
            padding: '0 0 0 16px',
            margin: 0,
            overflowY: 'auto',

            '& dt': {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',

                '& > span': {
                    fontSize: '16px',
                    fontWeight: 'bold',
                }
            }
        },
        item: {
            padding: '8px 0',
            margin: 0,
        
            '& label': {
                color: 'white'
            },
        
            '&:hover': {
                backgroundColor: theme.palette.action02Hover,
            }
        },
        list: {
            overflowY: 'auto',
            maxHeight: 'calc(400px - 40px)'
        }
    };
});

function ParticipantItem({
    isChecked,
    onChange,
    participant,
}) {
    const styles = useStyles();

    return (
        <dd className = { styles.item }>
            <Checkbox
                isChecked = { isChecked }
                label = { getParticipantName(participant) }
                onChange = { onChange } />
        </dd>
    );
}

function ParticipantsPane({
    isPinned,
    onChange,
    onReset,
    pinnedCount
}) {
    const styles = useStyles();
    const { t } = useTranslation();
    const _local = useSelector(state => state['features/base/participants'].local);
    const _remote = useSelector(state => state['features/base/participants'].sortedRemoteParticipants);
    const items = [];

    for (const [id, participant] of _remote) {
        items.push(<ParticipantItem
            isChecked = { isPinned(id) }
            key = { id }
            onChange = { onChange(id) }
            participant = { participant } />);
    }

    return (
        <dl className = { styles.container }>
            <dt>
                <span>{`${t('toolbar.participants')} (${pinnedCount})`}</span>
                { onReset && (
                    <Button
                        appearance = 'subtle'
                        onClick = { onReset }
                        spacing = 'compact'
                        type = 'button'>
                        { t('toolbar.reset') }
                    </Button>
                )}
            </dt>
            <Separator />
            <div className = { styles.list }>
                <ParticipantItem
                    isChecked = { isPinned(_local.id) }
                    onChange = { onChange(_local.id) }
                    participant = { _local } />
                {items}
            </div>
        </dl>
    )
}

export default ParticipantsPane;
