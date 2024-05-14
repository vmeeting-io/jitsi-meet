import React from 'react';
import { useTranslation } from 'react-i18next';

const NoRoomError = ({ className }) => {
    const { t } = useTranslation();

    return (
        <div className = { className } >
            <div>{t('info.noNumbers')}</div>
            <div>{t('info.noRoom')}</div>
        </div>
    );
};

export default NoRoomError;
