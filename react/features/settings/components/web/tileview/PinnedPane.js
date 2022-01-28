/* global interfaceConfig */

import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';

import { Icon, IconClose } from '../../../../base/icons';
import { getParticipantName } from './utils';

const useStyles = makeStyles(theme => {
    return {
        backdrop: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            fontSize: 16,
            color: theme.palette.action02Focus
        },
        closeButton: {
            cursor: 'pointer',
            position: 'absolute',
            right: 4,
            top: 4,
        },
        container: {
            backgroundColor: theme.palette.action02Disabled,
            flexGrow: 1,
            minHeight: '400px',
            position: 'relative'
        },
        contents: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            padding: 5,
        },
        participant: {
            position: 'relative',
            display: 'inline-flex',
            width: 'calc(20% - 10px)',
            height: 'calc(20% - 10px)',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme.palette.action02Hover,
            margin: '5px',
            borderRadius: '5px',
            padding: '5px',
            boxSizing: 'border-box',

            '& span': {
                overflow: 'hidden',
                textAlign: 'center',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
            },
        },
    };
});

const Sortable = SortableContainer(({ children, className }) => {
    return (
        <div className = { className }>
            {children}
        </div>
    );
});

const SortableItem = SortableElement(({ id, onRemove }) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const _local = useSelector(state => state['features/base/participants'].local);
    const _remote = useSelector(state => state['features/base/participants'].sortedRemoteParticipants);
    const participant = id === _local?.id ? _local : _remote?.get(id);

    return (
        <div className = { styles.participant }>
            <span>{getParticipantName(participant)}</span>
            <div
                className = { styles.closeButton }
                id = 'close-button'
                onClick = { onRemove }>
                <Icon
                    ariaLabel = { t('dialog.Remove') }
                    role = 'button'
                    size = { 14 }
                    src = { IconClose }
                    tabIndex = { 0 } />
            </div>
        </div>
    );
});

function PinnedPane({
    items,
    moveItem,
    onRemove,
}) {
    const styles = useStyles();
    const rows = useSelector(() => interfaceConfig.TILE_VIEW_MAX_COLUMNS);
    const { t } = useTranslation();

    return (
        <div id = 'pinned-pane' className = { styles.container }>
            <div className = { styles.backdrop }>
                <p>{t('dialog.pinParticipantsDescription', { rows })}</p>
                <p>{t('dialog.pinParticipantsDescription2')}</p>
            </div>
            <div className = { styles.contents }>
                <Sortable
                    onSortEnd = {moveItem}
                    className = { styles.contents }
                    axis = 'xy'
                    distance = {10}
                    helperContainer = {() => document.getElementById('pinned-pane') }>
                    {items.map((id, index) => (
                        <SortableItem
                            key = { id }
                            id = { id }
                            index = { index }
                            onRemove = { onRemove(id) } />
                    ))}
                </Sortable>
            </div>
        </div>
    );
}

export default PinnedPane;
