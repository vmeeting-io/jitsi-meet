/* global interfaceConfig */

import { makeStyles } from '@material-ui/core/styles';
import arrayMove from 'array-move';
import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';

import { Icon, IconClose } from '../../../../base/icons';

import ParticipantList from './ParticipantList';
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
            color: theme.palette.action02Focus,

            '& canvas': {
                position: 'absolute',
                height: '100%',
                width: '100%'
            },

            '& p': {
                zIndex: 1,
                color: 'white'
            }
        },
        closeButton: {
            cursor: 'pointer',
            position: 'absolute',
            right: 4,
            top: 4,
        },
        container: {
            '& h3': {
                color: 'white',
                fontSize: 16,
                fontWeight: 'bold',
                marginBottom: 10
            },

            '& p': {
                color: '#a0a0a0',
                marginBottom: 10
            }
        },
        contents: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            padding: 5,
        },
        contentWrapper: {
            display: 'flex',
            flexDirection: 'row'
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
        tileView: {
            backgroundColor: theme.palette.action02Disabled,
            flexGrow: 1,
            minHeight: '400px',
            position: 'relative'
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

const SortableItem = SortableElement(({ id, onRemove, style }) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const _local = useSelector(state => state['features/base/participants'].local);
    const _remote = useSelector(state => state['features/base/participants'].sortedRemoteParticipants);
    const participant = id === _local?.id ? _local : _remote?.get(id);

    return (
        <div className = { styles.participant } style = { style }>
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

function TileViewPinParticipantsSettings({
    onChange,
    selected,
    tileViewMaxColumns,
}) {
    const styles = useStyles();
    const { t } = useTranslation();
    const itemStyle = {
        height: `calc(${100 / tileViewMaxColumns}% - 10px)`,
        width: `calc(${100 / tileViewMaxColumns}% - 10px)`,
    };
    const canvasRef = useRef(null);
    
    useEffect(() => {
        if (!canvasRef || !canvasRef.current) {
            return;
        }

        const canvasEl = canvasRef.current;
        const canvasContext = canvasEl.getContext('2d');
        const { width, height } = canvasEl.getBoundingClientRect();
        canvasEl.width = width;
        canvasEl.height = height;

        canvasContext.beginPath();
        canvasContext.lineWidth = 5;
        canvasContext.strokeStyle = '#3D3D3D';
        const tileWidth = (width - 10) / tileViewMaxColumns;
        const tileHeight = (height - 10) / tileViewMaxColumns;
        canvasContext.clearRect(0, 0, width, height);
        canvasContext.rect(3, 3, width - 6, height - 6);
        canvasContext.stroke();

        canvasContext.beginPath();
        canvasContext.lineWidth = 0;
        canvasContext.fillStyle = '#3D3D3D';
        for (let row = 0; row < tileViewMaxColumns; row += 1) {
            const turn = row % 2;
            for (let col = 0; col < tileViewMaxColumns; col += 1) {
                if (col % 2 !== turn) {
                    canvasContext.rect(5 + col * tileWidth, 5 + row * tileHeight, tileWidth, tileHeight);
                    canvasContext.fill();
                }
            }
        }
    }, [canvasRef, tileViewMaxColumns]);

    const onChangeSelected = useCallback(newSelected => {
        onChange('selected', newSelected);
    }, [onChange]);

    const onSelect = useCallback(id => {
        return e => {
            let newSelected = selected;

            if (e.target.checked) {
                if (selected.length === (tileViewMaxColumns * tileViewMaxColumns)) {
                    console.error('Participants can pin up to', tileViewMaxColumns * tileViewMaxColumns);
                } else {
                    newSelected = [...selected, id]
                }
            } else {
                newSelected = selected.filter(v => v !== id);
            }

            onChange('selected', newSelected);
        };
    }, [onChange, selected, tileViewMaxColumns]);

    const onMoveItem = useCallback(({ oldIndex, newIndex }) => {
        onChange('selected', arrayMove(selected, oldIndex, newIndex));
    }, [onChange, selected]);

    return (
        <div className = { styles.container }>
            <h3>{ t('settings.tileViewPinned') }</h3>
            <p>{ t('settings.tileViewPinnedDescription') }</p>
            <div className = { styles.contentWrapper }>
                <div id = 'pinned-pane' className = { styles.tileView }>
                    <div className = { styles.backdrop }>
                        <canvas ref = { canvasRef } />
                        { selected?.length === 0 && (
                            <p>{t('dialog.pinParticipantsDescription', { rows: tileViewMaxColumns })}</p>
                        )}
                    </div>
                    <div className = { styles.contents }>
                        <Sortable
                            onSortEnd = { onMoveItem }
                            className = { styles.contents }
                            axis = 'xy'
                            distance = {10}
                            helperContainer = {() => document.getElementById('pinned-pane') }>
                            {selected.map((id, index) => (
                                <SortableItem
                                    key = { id }
                                    id = { id }
                                    index = { index }
                                    style = { itemStyle }
                                    onRemove = { onSelect(id) } />
                            ))}
                        </Sortable>
                    </div>
                </div>
                <ParticipantList
                    onChange = { onChangeSelected }
                    onSelect = { onSelect }
                    selected = { selected } />
            </div>
        </div>
    );
}

export default TileViewPinParticipantsSettings;
