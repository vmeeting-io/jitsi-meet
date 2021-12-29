/* @flow */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { setSubject } from '../../../base/conference';

import { getConferenceName } from '../../../base/conference/functions';
import { Icon, IconEdit } from '../../../base/icons';
import { getLocalParticipant, PARTICIPANT_ROLE } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { Tooltip } from '../../../base/tooltip';
import { showConfirmDialog } from '../../../notifications/functions.web';

type Props = {

    /**
     * Indicates whether the local participant is moderator or not.
     */
    _isModerator: Boolean,

    /**
     * The conference display name.
     */
    _subject: string
}

/**
 * Label for the conference name.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactElement}
 */
const SubjectText = ({ _isModerator, _subject }: Props) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const _onEditSubject = useCallback(() => {
        showConfirmDialog({
            text: t('dialog.changeSubject'),
            input: 'text',
            inputValue: _subject,
            showCancelButton: true,
            confirmButtonText: t('dialog.Change'),
            cancelButtonText: t('dialog.Cancel'),
            didOpen: () => {
                $('.swal2-input').select();
            }
        }).then(result => {
            if (result.isConfirmed) {
                dispatch(setSubject(result.value));
            }
        });
    });

    return (
        <div className = 'subject-text'>
            <Tooltip
                content = { _isModerator ? t('dialog.edit') : _subject }
                position = 'bottom'>
                <div
                    className = {`subject-text--content${_isModerator ? ' editable' : ''}`}
                    onClick = { _isModerator ? _onEditSubject : undefined }>
                    { _subject }
                    { _isModerator && <div className = 'button'>
                        <Icon size = { 16 } src = { IconEdit } />
                    </div> }
                </div>
            </Tooltip>
        </div>
    );
}


/**
 * Maps (parts of) the Redux state to the associated
 * {@code Subject}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _subject: string,
 * }}
 */
function _mapStateToProps(state) {
    const localParticipant = getLocalParticipant(state);
    const _isModerator = localParticipant?.role === PARTICIPANT_ROLE.MODERATOR;

    return {
        _isModerator,
        _subject: getConferenceName(state)
    };
}

export default connect(_mapStateToProps)(SubjectText);
