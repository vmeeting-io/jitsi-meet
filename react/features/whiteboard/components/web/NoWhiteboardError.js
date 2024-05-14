import React from 'react';
import { useTranslation } from 'react-i18next';

const NoWhiteboardError = ({ className }) => {
    const { t } = useTranslation();

    return (
        <div className = { className } >
            {t('info.noWhiteboard')}
        </div>
    );
};

export default NoWhiteboardError;
