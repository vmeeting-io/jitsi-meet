// @flow

// import CheckIcon from '@atlaskit/icon/glyph/check'
import Button from '@atlaskit/button/standard-button';
import { jitsiLocalStorage } from '@jitsi/js-utils';
import { filter, find, size } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { posts } from '../../../api';
import { Dialog } from '../../base/dialog';

const HAS_VISITED_BEFORE = 'hasVisitedBefore';

function NoticeDialog() {
    const { t } = useTranslation();

    const [showModal, setShowModal] = useState(false);
    const [data, setData] = useState([]);
    const [now] = useState(() => new Date());

    const onDontShowMeAgain = useCallback(_id => {
        const found = find(data, { _id });
        const hasVisitedBefore = JSON.parse(jitsiLocalStorage.getItem(HAS_VISITED_BEFORE) || '{}');

        if (!found) return;

        let expires = new Date();
        expires = expires.setHours(expires.getHours() + 24);
        hasVisitedBefore[_id] = expires;

        if (size(hasVisitedBefore) > 0) {
            jitsiLocalStorage.setItem(HAS_VISITED_BEFORE, JSON.stringify(hasVisitedBefore));
        } else {
            jitsiLocalStorage.removeItem(HAS_VISITED_BEFORE);
        }

        setData(data.filter(item => item._id !== _id));
    }, [data]);

    const onCloseNotice = useCallback(_id => {
        const newData = data.filter(item => item._id !== _id);
        setData(newData);
    }, [data]);

    const setModalState = useCallback(bool => {
        if (showModal === bool) return;

        if (bool) {
            document.body.classList.add('show-notice');
        } else {
            document.body.classList.remove('show-notice');
        }
        setShowModal(bool);
    }, [showModal]);

    useEffect(() => {
        const hasVisitedBefore = JSON.parse(jitsiLocalStorage.getItem(HAS_VISITED_BEFORE) || '{}');
        posts()
            .pagination(false)
            .status('publish')
            .then(resp => {
                setData(resp.data.docs.map(item => ({
                    ...item,
                    visible: !Boolean(hasVisitedBefore[item._id] > now)
                })));
            });
    }, []);

    useEffect(() => {
        if (data.length === 0) {
            setModalState(false);
            return;
        }

        const hasVisitedBefore = JSON.parse(jitsiLocalStorage.getItem(HAS_VISITED_BEFORE) || '{}');
        const hiddens = filter(data, item => hasVisitedBefore[item._id] > now);

        setModalState(data.length > 0 && hiddens.length < data.length);
    }, [data, setModalState]);

    if (!showModal) return null;

    return (
        <Dialog
            cancelDisabled = { true }
            className = 'notice-dialog'
            disableFooter = { true }
            submitDisabled = { true }
            width = '500px'>
            <div className = 'notice-dialog-container'>
                { data.map(item => item.visible ? (
                    <div className = 'notice-dialog-wrapper' key = { item._id }>
                        <div
                            className = 'notice-dialog-content'
                            dangerouslySetInnerHTML = { {__html: item.content} }>
                        </div>
                        <div className = 'notice-dialog-footer'>
                            <Button
                                appearance = 'subtle'
                                onClick = { () => onDontShowMeAgain(item._id) }
                                type = 'button'>
                                { t('dialog.dontShowMeAgain') }
                            </Button>
                            <Button
                                appearance = 'primary'
                                onClick = { () => onCloseNotice(item._id) }
                                type = 'button'>
                                { t('dialog.close') }
                            </Button>
                        </div>
                    </div>
                ) : null) }
            </div>
        </Dialog>
    );
}

export default NoticeDialog;
