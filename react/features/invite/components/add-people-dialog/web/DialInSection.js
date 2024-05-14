import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../../../base/styles/functions.web';
import { getDialInfoPageURL, hasMultipleNumbers } from '../../../functions';

import DialInNumber from './DialInNumber';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            '& .info-label': {
                ...withPixelLineHeight(theme.typography.bodyLongBold)
            }
        },

        link: {
            ...withPixelLineHeight(theme.typography.bodyLongRegular),
            color: theme.palette.link01,

            '&:hover': {
                color: theme.palette.link01Hover
            }
        }
    };
});

/**
 * Returns a ReactElement for showing how to dial into the conference, if
 * dialing in is available.
 *
 * @private
 * @returns {null|ReactElement}
 */
function DialInSection({
    phoneNumber
}) {
    const { classes, cx } = useStyles();
    const conferenceID = useSelector((state) => state['features/invite'].conferenceID);
    const dialInfoPageUrl = useSelector(getDialInfoPageURL);
    const showMoreNumbers = useSelector((state) => hasMultipleNumbers(state['features/invite'].numbers));
    const { t } = useTranslation();

    return (
        <div className = { classes.container }>
            <DialInNumber
                conferenceID = { conferenceID ?? '' }
                phoneNumber = { phoneNumber } />
            {showMoreNumbers ? <a
                className = { cx('more-numbers', classes.link) }
                href = { dialInfoPageUrl }
                rel = 'noopener noreferrer'
                target = '_blank'>
                { t('info.moreNumbers') }
            </a> : null}
        </div>
    );
}

export default DialInSection;
