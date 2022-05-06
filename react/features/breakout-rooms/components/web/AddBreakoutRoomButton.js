// @flow

import { makeStyles } from '@material-ui/core/styles';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import ParticipantPaneBaseButton from '../../../participants-pane/components/web/ParticipantPaneBaseButton';
import { createBreakoutRoom } from '../../actions';
import { isInBreakoutRoom } from '../../functions';

const useStyles = makeStyles(() => {
    return {
        button: {
            width: '100%'
        }
    };
});

export const AddBreakoutRoomButton = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const styles = useStyles();
    const inBreakoutRoom = useSelector(isInBreakoutRoom);

    const onAdd = useCallback(() =>
        dispatch(createBreakoutRoom())
    , [ dispatch ]);

    if (inBreakoutRoom) {
        return null;
    }

    return (
        <ParticipantPaneBaseButton
            accessibilityLabel = { t('breakoutRooms.actions.add') }
            className = { styles.button }
            onClick = { onAdd }>
            {t('breakoutRooms.actions.add')}
        </ParticipantPaneBaseButton>
    );
};
