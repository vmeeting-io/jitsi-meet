// @flow

import Spinner from '@atlaskit/spinner';
import axios from 'axios';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAuthUrl } from '../../../api/url';

import { Dialog, hideDialog, openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { Icon, IconCancelSelection, IconPlusCircle, IconShareDesktop } from '../../base/icons';
import { browser } from '../../base/lib-jitsi-meet';
import { createLocalTrack } from '../../base/lib-jitsi-meet/functions';
import { VIDEO_TYPE } from '../../base/media';
import { connect } from '../../base/redux';
import { updateSettings } from '../../base/settings';
import { Tooltip } from '../../base/tooltip';
import { getLocalVideoTrack } from '../../base/tracks';
import TouchmoveHack from '../../chat/components/web/TouchmoveHack';
import { showErrorNotification, showWarningNotification } from '../../notifications';
import { backgroundEnabled, setVirtualBackground, toggleBackgroundEffect } from '../actions';
import { VIRTUAL_BACKGROUND_TYPE } from '../constants';
import { getRemoteImageUrl, toDataURL } from '../functions';
import logger from '../logger';

import VirtualBackgroundPreview from './VirtualBackgroundPreview';

const COL_WIDTH = 105 + 9;
const ROW_HEIGHT = 60 + 8;
const images = [
    {
        tooltip: 'image1',
        id: '1',
        src: 'images/virtual-background/background-1.jpg'
    },
    {
        tooltip: 'image2',
        id: '2',
        src: 'images/virtual-background/background-2.jpg'
    },
    {
        tooltip: 'image3',
        id: '3',
        src: 'images/virtual-background/background-3.jpg'
    },
    {
        tooltip: 'image4',
        id: '4',
        src: 'images/virtual-background/background-4.jpg'
    },
    {
        tooltip: 'image5',
        id: '5',
        src: 'images/virtual-background/background-5.jpg'
    },
    {
        tooltip: 'image6',
        id: '6',
        src: 'images/virtual-background/background-6.jpg'
    },
    {
        tooltip: 'image7',
        id: '7',
        src: 'images/virtual-background/background-7.jpg'
    }
];
type Props = {

    /**
     * The current local flip x status.
     */
    _localFlipX: boolean,

    /**
     * Returns the jitsi track that will have backgraund effect applied.
     */
    _jitsiTrack: Object,

    /**
     * Returns the selected virtual background object.
     */
    _virtualBackground: Object,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The initial options copied in the state for the {@code VirtualBackground} component.
     *
     * NOTE: currently used only for electron in order to open the dialog in the correct state after desktop sharing
     * selection.
     */
    initialOptions: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

const onError = event => {
    event.target.style.display = 'none';
};


const VirtualBackgroundDialog = translate(connect(_mapStateToProps)(VirtualBackground));

/**
 * Renders virtual background dialog.
 *
 * @returns {ReactElement}
 */
function VirtualBackground({
    _apiBase,
    _jitsiTrack,
    _localFlipX,
    _virtualBackground,
    _virtualSource,
    dispatch,
    t
}: Props) {
    const [ origin ] = useState(_virtualBackground);
    const [ options, setOptions ] = useState(_virtualBackground);
    const [ remoteImages, setRemoteImages ] = useState([]);
    const [ loading, setLoading ] = useState(false);
    const [ dialogElement, setDialogElement ] = useState();
    const [ activeDesktopVideo ] = useState(_virtualSource?.videoType === VIDEO_TYPE.DESKTOP ? _virtualSource : null);
    const uploadImageButton: Object = useRef(null);

    /**
     * Loads images from server.
     */
    useEffect(() => {
        async function loadRemoteImages() {
            setLoading(true);
            try {
                const resp = await axios.get(`${_apiBase}/backgrounds?pagination=false`);
                setRemoteImages([...resp.data.docs, ...remoteImages]);
                setLoading(false);
            } catch {
                setLoading(false);
            }
        }

        loadRemoteImages();
    }, []);


    const enableBlur = useCallback(async () => {
        setOptions({
            backgroundType: VIRTUAL_BACKGROUND_TYPE.BLUR,
            enabled: true,
            blurValue: 25,
            selectedThumbnail: 'blur'
        });
        logger.info('"Blur" option setted for virtual background preview!');

    }, []);

    const enableBlurKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            enableBlur();
        }
    }, [ enableBlur ]);

    const enableSlideBlur = useCallback(async () => {
        setOptions({
            backgroundType: VIRTUAL_BACKGROUND_TYPE.BLUR,
            enabled: true,
            blurValue: 8,
            selectedThumbnail: 'slight-blur'
        });
        logger.info('"Slight-blur" option setted for virtual background preview!');

    }, []);

    const enableSlideBlurKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            enableSlideBlur();
        }
    }, [ enableSlideBlur ]);


    const shareDesktop = useCallback(async () => {
        let isCancelled = false, url;

        try {
            url = await createLocalTrack('desktop', '');
        } catch (e) {
            if (e.name === JitsiTrackErrors.SCREENSHARING_USER_CANCELED) {
                isCancelled = true;
            } else {
                logger.error(e);
            }
        }



        if (!url) {
            if (!isCancelled) {
                dispatch(showErrorNotification({
                    titleKey: 'virtualBackground.desktopShareError'
                }));
                logger.error('Could not create desktop share as a virtual background!');
            }

            /**
             * For electron createLocalTrack will open the {@code DesktopPicker} dialog and hide the
             * {@code VirtualBackgroundDialog}. That's why we need to reopen the {@code VirtualBackgroundDialog}
             * and restore the current state through {@code initialOptions} prop.
             */
            if (browser.isElectron()) {
                dispatch(openDialog(VirtualBackgroundDialog, { initialOptions: options }));
            }

            return;
        }

        if (Array.isArray(url)){ //if createLocalTrack returns both audio and video track
            url = url[1]; //url[0] is audio track
            dispatch(showWarningNotification({
                titleKey: 'virtualBackground.desktopShareAudioWarning',
                descriptionKey: 'virtualBackground.desktopShareAudioWarningDesc'
            }));
        }

        const newOptions = {
            backgroundType: VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE,
            enabled: true,
            selectedThumbnail: 'desktop-share',
            url
        };

        /**
         * For electron createLocalTrack will open the {@code DesktopPicker} dialog and hide the
         * {@code VirtualBackgroundDialog}. That's why we need to reopen the {@code VirtualBackgroundDialog}
         * and force it to show desktop share virtual background through {@code initialOptions} prop.
         */
        if (browser.isElectron()) {
            dispatch(openDialog(VirtualBackgroundDialog, { initialOptions: newOptions }));
        } else {
            setOptions(newOptions);
            logger.info('"Desktop-share" option setted for virtual background preview!');
        }
    }, [ dispatch, options ]);

    const shareDesktopKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            shareDesktop();
        }
    }, [ shareDesktop ]);

    const setUploadedImageBackground = useCallback(async e => {
        const imageId = e.currentTarget.getAttribute('data-imageid');
        const image = remoteImages.find(img => img._id === imageId);

        if (image) {
            setOptions({
                backgroundType: 'image',
                enabled: true,
                url: getRemoteImageUrl(image),
                selectedThumbnail: image._id
            });
        }
    }, [ remoteImages ]);

    const removeBackground = useCallback(async e => {
        const imageId = e.currentTarget.getAttribute('data-imageid');
        const image = remoteImages.find(img => img._id === imageId);

        if (!image || image._id === options.selectedThumbnail) {
            setOptions({
                enabled: false,
                selectedThumbnail: 'none'
            });
            logger.info('Uploaded image setted for virtual background preview!');
        }
        if (image) {
            setRemoteImages(remoteImages.filter(item => image !== item));
            axios.delete(`${_apiBase}/backgrounds/${image._id}`);
        }
    }, [ options, remoteImages ]);

    const removeBackgroundKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            removeBackground(e);
        }
    }, [ removeBackground ]);

    const setImageBackground = useCallback(async e => {
        const imageId = e.currentTarget.getAttribute('data-imageid');
        const image = images.find(img => img.id === imageId);

        if (image) {
            const url = await toDataURL(image.src);

            setOptions({
                backgroundType: 'image',
                enabled: true,
                url,
                selectedThumbnail: image.id
            });
            logger.info('Image setted for virtual background preview!');

            setLoading(false);
        }
    }, []);

    const uploadImage = useCallback(async e => {
        const imageFile = e.target.files;
        const form = new FormData();

        setLoading(true);
        form.append(imageFile[0].name, imageFile[0]);
        e.target.value = '';

        try {
            const resp = await axios.post(`${_apiBase}/backgrounds`, form);
            const image = resp.data[resp.data.length - 1];
            setRemoteImages([
                ...remoteImages,
                image
            ]);
            setOptions({
                backgroundType: VIRTUAL_BACKGROUND_TYPE.IMAGE,
                enabled: true,
                url: getRemoteImageUrl(image, 'hd'),
                selectedThumbnail: image._id
            });
            setLoading(false);
        } catch {
            setLoading(false);
            logger.error('Failed to upload virtual image!');
        }
    }, [ remoteImages ]);

    const uploadImageKeyPress = useCallback(e => {
        if (uploadImageButton.current && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            uploadImageButton.current.click();
        }
    }, [ uploadImageButton.current ]);

    const setImageBackgroundKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setImageBackground(e);
        }
    }, [ setImageBackground ]);

    const setUploadedImageBackgroundKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setUploadedImageBackground(e);
        }
    }, [ setUploadedImageBackground ]);

    const applyVirtualBackground = useCallback(async () => {
        if (activeDesktopVideo) {
            await activeDesktopVideo.dispose();
        }
        setLoading(true);
        await dispatch(toggleBackgroundEffect(options, _jitsiTrack));
        await setLoading(false);
        if (_localFlipX && options.backgroundType === VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE) {
            dispatch(updateSettings({
                localFlipX: !_localFlipX
            }));
        } else {

            // Set x scale to default value.
            dispatch(updateSettings({
                localFlipX: true
            }));
        }
        dispatch(hideDialog());
        logger.info(`Virtual background type: '${typeof options.backgroundType === 'undefined'
            ? 'none' : options.backgroundType}' applied!`);
    }, [ dispatch, options, _localFlipX ]);

    const cancelVirtualBackground = useCallback(async () => {
        await dispatch(backgroundEnabled(origin.backgroundEffectEnabled));
        const origin_fixed = {
            ...origin,
            url: origin.virtualSource
        }
        await dispatch(setVirtualBackground(origin_fixed));
    }, [ dispatch, origin ]);

    const onDialogRef = useCallback(el => {
        setDialogElement(el);
    }, [setDialogElement]);

    return (
        <Dialog
            className = 'virtual-background-dialog-content'
            hideCancelButton = { false }
            okKey = { 'virtualBackground.apply' }
            onCancel = { cancelVirtualBackground }
            onSubmit = { applyVirtualBackground }
            onRef = { onDialogRef }
            submitDisabled = { !options || loading }
            titleKey = { 'virtualBackground.title' } >
            <VirtualBackgroundPreview
                options = { options } />
            <div className = 'virtual-background-content'>
                {loading ? (
                    <div className = 'virtual-background-loading'>
                        <Spinner
                            isCompleting = { false }
                            size = 'small' />
                    </div>
                ) : (
                    <label
                        aria-label = { t('virtualBackground.uploadImage') }
                        className = 'file-upload-label'
                        htmlFor = 'file-upload'
                        onKeyPress = { uploadImageKeyPress }
                        tabIndex = { 0 } >
                        <Icon
                            className = { 'add-background' }
                            size = { 20 }
                            src = { IconPlusCircle } />
                        {t('virtualBackground.addBackground')}
                    </label>
                )}
                <input
                    accept = 'image/*'
                    className = 'file-upload-btn'
                    id = 'file-upload'
                    onChange = { uploadImage }
                    ref = { uploadImageButton }
                    type = 'file' />
                <TouchmoveHack isModal = { true } style = {{ overflow: 'visible' }}>
                    <div
                        className = 'virtual-background-dialog'
                        role = 'radiogroup'
                        tabIndex = '-1'>
                        <Tooltip
                            content = { t('virtualBackground.removeBackground') }
                            position = { 'top' }>
                            <div
                                aria-checked = { options.selectedThumbnail === 'none' }
                                aria-label = { t('virtualBackground.removeBackground') }
                                className = { options.selectedThumbnail === 'none' ? 'background-option none-selected'
                                    : 'background-option virtual-background-none' }
                                onClick = { removeBackground }
                                onKeyPress = { removeBackgroundKeyPress }
                                role = 'radio'
                                tabIndex = { 0 } >
                                {t('virtualBackground.none')}
                            </div>
                        </Tooltip>
                        <Tooltip
                            content = { t('virtualBackground.slightBlur') }
                            position = { 'top' }>
                            <div
                                aria-checked = { options.selectedThumbnail === 'slight-blur' }
                                aria-label = { t('virtualBackground.slightBlur') }
                                className = { options.selectedThumbnail === 'slight-blur'
                                    ? 'background-option slight-blur-selected' : 'background-option slight-blur' }
                                onClick = { enableSlideBlur }
                                onKeyPress = { enableSlideBlurKeyPress }
                                role = 'radio'
                                tabIndex = { 0 }>
                                {t('virtualBackground.slightBlur')}
                            </div>
                        </Tooltip>
                        <Tooltip
                            content = { t('virtualBackground.blur') }
                            position = { 'top' }>
                            <div
                                aria-checked = { options.selectedThumbnail === 'blur' }
                                aria-label = { t('virtualBackground.blur') }
                                className = { options.selectedThumbnail === 'blur' ? 'background-option blur-selected'
                                    : 'background-option blur' }
                                onClick = { enableBlur }
                                onKeyPress = { enableBlurKeyPress }
                                role = 'radio'
                                tabIndex = { 0 }>
                                {t('virtualBackground.blur')}
                            </div>
                        </Tooltip>
                        <Tooltip
                            content = { t('virtualBackground.desktopShare') }
                            position = { 'top' }>
                            <div
                                aria-checked = { options.selectedThumbnail === 'desktop-share' }
                                aria-label = { t('virtualBackground.desktopShare') }
                                className = { options.selectedThumbnail === 'desktop-share'
                                    ? 'background-option desktop-share-selected'
                                    : 'background-option desktop-share' }
                                onClick = { shareDesktop }
                                onKeyPress = { shareDesktopKeyPress }
                                role = 'radio'
                                tabIndex = { 0 }>
                                <Icon
                                    className = 'share-desktop-icon'
                                    size = { 30 }
                                    src = { IconShareDesktop } />
                            </div>
                        </Tooltip>
                        {images.map((image, index) => (
                            <Tooltip
                                content = { image.tooltip && t(`virtualBackground.${image.tooltip}`) }
                                key = { image.id }
                                position = { 'top' }>
                                <img
                                    alt = { image.tooltip && t(`virtualBackground.${image.tooltip}`) }
                                    aria-checked = { options.selectedThumbnail === image.id
                                        || options.selectedThumbnail === image.id }
                                    className = {
                                        options.selectedThumbnail === image.id
                                            ? 'background-option thumbnail-selected' : 'background-option thumbnail' }
                                    data-imageid = { image.id }
                                    onClick = { setImageBackground }
                                    onError = { onError }
                                    onKeyPress = { setImageBackgroundKeyPress }
                                    role = 'radio'
                                    src = { image.src }
                                    tabIndex = { 0 } />
                            </Tooltip>
                        ))}
                        {remoteImages.map((image, index) => (
                            <div
                                className = { 'thumbnail-container' }
                                key = { image._id }>
                                <img
                                    alt = { t('virtualBackground.uploadedImage', { index: index + 1 }) }
                                    aria-checked = { options.selectedThumbnail === image.id }
                                    className = { options.selectedThumbnail === image._id
                                        ? 'background-option thumbnail-selected' : 'background-option thumbnail' }
                                    data-imageid = { image._id }
                                    onClick = { setUploadedImageBackground }
                                    onError = { onError }
                                    onKeyPress = { setUploadedImageBackgroundKeyPress }
                                    role = 'radio'
                                    src = { getRemoteImageUrl(image, 'ld') }
                                    tabIndex = { 0 } />
                                { !image.isPublic && (
                                    <Icon
                                        ariaLabel = { t('virtualBackground.deleteImage') }
                                        className = { 'delete-image-icon' }
                                        data-imageid = { image._id }
                                        onClick = { removeBackground }
                                        onKeyPress = { removeBackgroundKeyPress }
                                        role = 'button'
                                        size = { 15 }
                                        src = { IconCancelSelection }
                                        tabIndex = { 0 } />
                                )}
                            </div>
                        ))}
                    </div>
                </TouchmoveHack>
            </div>
        </Dialog>
    );
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code VirtualBackgroundDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Object}
 */
function _mapStateToProps(state) {
    const { localFlipX } = state['features/base/settings'];

    return {
        _localFlipX: Boolean(localFlipX),
        _apiBase: getAuthUrl(state),
        _jitsiTrack: getLocalVideoTrack(state['features/base/tracks'])?.jitsiTrack,
        _virtualBackground: state['features/virtual-background'],
        _virtualSource: state['features/virtual-background'].virtualSource
    };
}

export default translate(connect(_mapStateToProps)(VirtualBackground));
