// @flow

import { Checkbox } from '@atlaskit/checkbox';
import Button from '@atlaskit/button/standard-button';
import { jitsiLocalStorage } from '@jitsi/js-utils';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';

const HAS_VISITED_BEFORE = 'hasVisitedBefore';

function NoticeDialog(props) {
    const [showModal, setShowModal] = useState(false);
    const { t } = useTranslation();

    const onDontShowMeAgain = useCallback(e => {
        if (e.target.checked) {
            let expires = new Date();
            expires = expires.setHours(expires.getHours() + 24);
            jitsiLocalStorage.setItem(HAS_VISITED_BEFORE, expires);
        } else if (jitsiLocalStorage.getItem(HAS_VISITED_BEFORE)) {
            jitsiLocalStorage.removeItem(HAS_VISITED_BEFORE);
        }
    }, []);

    useEffect(() => {
        const hasVisitedBefore = jitsiLocalStorage.getItem(HAS_VISITED_BEFORE);

        if (!config.noticeMessage) {
            return;
        }

        if (hasVisitedBefore && hasVisitedBefore > new Date()) {
            return;
        }

        setShowModal(true);
    }, []);

    if (!showModal) return null;

    return (
        <Dialog
            cancelDisabled = { true }
            className = 'notice-dialog'
            disableFooter = { true }
            submitDisabled = { true }
            width = 'small'>
            <div
                className = 'notice-dialog-content'
                dangerouslySetInnerHTML = { {__html: decodeURIComponent(config.noticeMessage)} }>
            </div>
            <div className = 'notice-dialog-footer'>
                <Checkbox
                    label = { t('dialog.dontShowMeAgain') }
                    onChange = { onDontShowMeAgain }
                    name = "dont-show-me-again"
                    size = 'large' />
                <Button
                    appearance = 'primary'
                    onClick = { () => setShowModal(false) }
                    type = 'button'>
                    { t('dialog.close') }
                </Button>
            </div>
        </Dialog>
    );
}

export default translate(NoticeDialog);
