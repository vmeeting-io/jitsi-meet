import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import React, { useCallback, useRef, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import { translate } from '../../base/i18n/functions';
import Icon from '../../base/icons/components/Icon';
import { IconPlus } from '../../base/icons/svg';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import { VIRTUAL_BACKGROUND_TYPE } from '../constants';
import logger from '../logger';
import { backgrounds } from '../../../api/backgrounds';
import { getRemoteImageUrl } from '../functions';

const useStyles = makeStyles()(theme => {
    return {
        label: {
            ...withPixelLineHeight(theme.typography.bodyShortBold),
            color: theme.palette.link01,
            marginBottom: theme.spacing(3),
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10
        },

        addBackground: {
            marginRight: theme.spacing(3),

            '& svg': {
                fill: `${theme.palette.link01} !important`
            }
        },

        input: {
            display: 'none'
        }
    };
});

/**
 * Component used to upload an image.
 *
 * @param {Object} Props - The props of the component.
 * @returns {React$Node}
 */
function UploadImageButton({
    setOptions,
    setStoredImages,
    showLabel,
    storedImages,
    t
}) {
    const { classes } = useStyles();
    const [loading, setLoading] = useState(false);
    const uploadImageButton = useRef(null);
    const uploadImageKeyPress = useCallback(e => {
        if (uploadImageButton.current && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            uploadImageButton.current.click();
        }
    }, [ uploadImageButton.current ]);

    const uploadImage = useCallback(async e => {
        const imageFile = e.target.files;
        const form = new FormData();

        setLoading(true);
        form.append(imageFile[0].name, imageFile[0]);
        e.target.value = '';

        try {
            const resp = await backgrounds().create(form);
            const image = resp.data.docs[resp.data.docs.length - 1];
            setStoredImages([
                ...storedImages,
                image
            ]);
            setOptions({
                backgroundEffectEnabled: true,
                backgroundType: VIRTUAL_BACKGROUND_TYPE.IMAGE,
                selectedThumbnail: image.id,
                virtualSource: getRemoteImageUrl(image)
            })
            logger.info('New virtual background image uploaded!');
            setTimeout(() => {
                const el = document.querySelector(`img[data-imageid='${image.id}']`);
                console.log('el:', `img[data-imageid='${image.id}']`, el);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                }
            }, 300);
        } catch {
            logger.error('Failed to upload virtual image!');
        } finally {
            setLoading(false);
        }
    }, [ storedImages ]);

    return (
        <>
            {showLabel && <label
                className = { classes.label }
                htmlFor = 'file-upload'
                onKeyPress = { uploadImageKeyPress }
                tabIndex = { 0 } >
                { loading ? <LoadingOutlined /> : <PlusOutlined /> }
                {t('virtualBackground.addBackground')}
            </label>}

            <input
                accept = 'image/*'
                className = { classes.input }
                id = 'file-upload'
                onChange = { uploadImage }
                ref = { uploadImageButton }
                type = 'file' />
        </>
    );
}

export default translate(UploadImageButton);
