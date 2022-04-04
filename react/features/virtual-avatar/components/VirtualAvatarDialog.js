// @flow

import Spinner from '@atlaskit/spinner';
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { getAuthUrl } from '../../../api/url';
import { Dialog, hideDialog, openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { updateSettings } from '../../base/settings';
import { Tooltip } from '../../base/tooltip';
import { VIDEO_TYPE } from '../../base/media';
import { getLocalVideoTrack } from '../../base/tracks';
import TouchmoveHack from '../../chat/components/web/TouchmoveHack';
import { Icon, IconCancelSelection, IconPlusCircle, IconShareDesktop } from '../../base/icons';
import {
    virtualAvatarEnabled,
    setVirtualAvatar,
    toggleVirtualAvatarEffect,
    virtualAvatarTrackChanged
} from '../actions';
import { toDataURL, toggleAvatarAndBackgroundEffects } from '../functions';
import logger from '../logger';

import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';

import VirtualAvatarPreview from './VirtualAvatarPreview';
import axios from 'axios';
import {images as backgroundImages} from '../../virtual-background/components/VirtualBackgroundDialog';
import {getRemoteImageUrl} from '../../virtual-background/functions';

const prebuildAvatars = [
    {
        id: '1',
        src: 'images/virtual-avatar/man-1.jpg',
        modelUrl: 'https://d1a370nemizbjq.cloudfront.net/25502881-022b-4689-8e88-bef3fab1edfc.glb'
    },

    {
        id: '2',
        src: 'images/virtual-avatar/woman-1.jpg',
        modelUrl: 'https://d1a370nemizbjq.cloudfront.net/97c21f02-2d94-4753-a180-45063954e641.glb'
    },

    {
        id: '3',
        src: 'images/virtual-avatar/woman-2.jpg',
        modelUrl: 'https://d1a370nemizbjq.cloudfront.net/de08cef3-94cc-43e2-a709-82a37a387c37.glb'
    },
    {
        id: '4',
        src: 'images/virtual-avatar/man-2.jpg',
        modelUrl: 'https://d1a370nemizbjq.cloudfront.net/e7068183-1e83-40a2-bcf8-e2914c0fcb66.glb'
    },
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
     * Returns the selected virtual avatar object.
     */
    _virtualAvatar: Object,

    /**
     * Returns the selected virtual background object.
     */
    _virtualBackground: Object,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The initial options copied in the state for the {@code VirtualAvatar} component.
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


const VirtualAvatarDialog = translate(connect(_mapStateToProps)(VirtualAvatar));

const renderModelThumbnail = async modelUrl => {
    if (modelUrl === null || modelUrl === 'none')
        return null;

    const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setSize(320, 180);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1c26);

    const loader = new GLTFLoader();
    loader.crossOrigin = "anonymous";
    // Import model from URL, add your own model here
    const model = await loader.loadAsync(modelUrl);
    scene.add(model.scene);
    scene.updateMatrixWorld(true);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment()).texture;

    const orbitCamera = new THREE.PerspectiveCamera(20, 16/9, 0.1, 1000);
    const headBone = scene.getObjectByName("Head");
    const { y } = headBone.matrixWorld.getPosition();
    orbitCamera.position.set(0.0, y+0.05, 1);

    renderer.render(scene, orbitCamera);

    return renderer.domElement.toDataURL();
}

/**
 * Renders virtual avatar dialog.
 *
 * @returns {ReactElement}
 */
function VirtualAvatar({
    _apiBase,
    _jitsiTrack,
    _localFlipX,
    _virtualAvatar,
    _virtualBackground,
    dispatch,
    t
}: Props) {
    const [ previewIsLoaded, setPreviewIsLoaded ] = useState(false);
    const [ originAvatar ] = useState(_virtualAvatar);
    const [originBackground] = useState(_virtualBackground);
    const [options, setOptions] = useState({ ..._virtualAvatar, enabled: _virtualAvatar.virtualAvatarEffectEnabled});
    const [ loading, setLoading ] = useState(false);
    const [createVirtualAvatar, setCreateVirtualAvatar ] = useState(false);
    const [rpVirtualAvatarUrl, setVirtualAvatarUrl] = useState(_virtualAvatar.virtualAvatarType === 'readyplayer' ? _virtualAvatar.selectedVirtualAvatarUrl : null);
    const [remoteImages, setRemoteImages] = useState([]);
    const [rpThumnailUrl, setRpThumnailUrl] = useState(null);

    const iframe = useRef(null);
    const rpAvatarEl = useRef(null);


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

    // load rpThumnailUrl
    useEffect(() => {
        async function loadOldRpThumnail() {
            if (rpVirtualAvatarUrl === 'none' || rpVirtualAvatarUrl === null)
                return;

            setLoading(true);
            setRpThumnailUrl(await renderModelThumbnail(rpVirtualAvatarUrl));
            setLoading(false);
        }

        loadOldRpThumnail();
    }, []);



    const removeVirtualAvatar = useCallback(async e => {
        setOptions({
            ...options,
            enabled: false,
            selectedVirtualAvatarUrl: 'none',
        });
    }, [options]);


    const setPreviewVirtualAvatar = useCallback(async e => {
        const avatarId = e.currentTarget.getAttribute('data-imageid');
        const avatar = prebuildAvatars.find(avatar => avatar.id === avatarId);

        if (avatar) {
            setOptions({
                ...options,
                virtualAvatarType: 'avatar',
                enabled: true,
                selectedVirtualAvatarUrl: avatar.modelUrl,
            });
            logger.info('Image setted for virtual avatar preview!');

            setLoading(false);
        }
    }, [options]);

    const setReadyplayerAvatar = useCallback(async e => {
        setOptions({
            ...options,
            virtualAvatarType: 'readyplayer',
            enabled: true,
            selectedVirtualAvatarUrl: rpVirtualAvatarUrl,
        });

        setLoading(false);

    }, [rpVirtualAvatarUrl, options]);


    const applyVirtualAvatar = useCallback(async () => {
        setLoading(true);
        // await dispatch(toggleVirtualAvatarEffect(options, _jitsiTrack));
        await toggleAvatarAndBackgroundEffects(dispatch, options, _jitsiTrack);
        setLoading(false);

        // Set x scale to default value.
        dispatch(updateSettings({
            localFlipX: !options.enabled,
        }));

        dispatch(hideDialog());
        dispatch(virtualAvatarTrackChanged());
    }, [ dispatch, options, _localFlipX ]);

    const cancelVirtualAvatar = useCallback(async () => {
        const originOptions = {
            virtualAvatarType: originAvatar.virtualAvatarType,
            enabled: originAvatar.virtualAvatarEffectEnabled,
            selectedVirtualAvatarUrl: originAvatar.selectedVirtualAvatarUrl,
            selectedBackgroundUrl: originAvatar.selectedBackgroundUrl,
            selectedBackgroundId: originAvatar.selectedBackgroundId,
        }

        setOptions(originOptions);

        if (originAvatar.virtualAvatarEffectEnabled) {
            await dispatch(toggleVirtualAvatarEffect(originOptions, _jitsiTrack));
            dispatch(updateSettings({
                localFlipX: originAvatar.virtualAvatarEffectEnabled? false : _localFlipX
            }));
            await dispatch(virtualAvatarTrackChanged());
        }
    }, [dispatch, originAvatar, options, _localFlipX ]);

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
                ...options,
                selectedBackgroundUrl: getRemoteImageUrl(image, 'hd'),
                selectedBackgroundId: image._id
            });
            setLoading(false);
        } catch {
            setLoading(false);
            logger.error('Failed to upload virtual image!');
        }
    }, [remoteImages]);

    const removeBackground = useCallback(async e => {
        const imageId = e.currentTarget.getAttribute('data-imageid');
        const image = remoteImages.find(img => img._id === imageId);

        if (!image || image._id === options.selectedThumbnail) {
            setOptions({
                enabled: false,
                selectedBackgroundId: 'none'
            });
        }
        if (image) {
            setRemoteImages(remoteImages.filter(item => image !== item));
            axios.delete(`${_apiBase}/backgrounds/${image._id}`);
        }
    }, [options, remoteImages]);

    const setImageBackground = useCallback(async e => {
        const imageId = e.currentTarget.getAttribute('data-imageid');
        const image = backgroundImages.find(img => img.id === imageId);

        if (image) {
            const url = await toDataURL(image.src);
            setOptions({...options,
                selectedBackgroundUrl: url,
                selectedBackgroundId: imageId,
            });

            setLoading(false);
        }
    }, [options]);

    const setUploadedImageBackground = useCallback(async e => {
        const imageId = e.currentTarget.getAttribute('data-imageid');
        const image = remoteImages.find(img => img._id === imageId);

        if (image) {
            setOptions({
                backgroundType: 'image',
                enabled: true,
                selectedThumbnail: image._id
            });
            setOptions({
                ...options,
                selectedBackgroundUrl: getRemoteImageUrl(image),
                selectedBackgroundId: imageId,
            });
        }
    }, [remoteImages, options]);

    const removeAvatarBackground = useCallback(async e => {
        setOptions({
            ...options,
            selectedBackgroundUrl: 'none',
            selectedBackgroundId: 'none'
        });

        setLoading(false);
    }, [options]);

    const loadedPreviewState = useCallback(async loaded => {
        setPreviewIsLoaded(loaded);
    });

    const parseJsonWithNull = (event) => {
        try {
            return JSON.parse(event.data);
        } catch (error) {
            return null;
        }
    }

    const rpConfigVirtualAvatarIframe = _iframe => {
        if (_iframe === null) return;
        iframe.current = _iframe;
    }

    useEffect(() => {
        const subscribe = async event => {
            const json = parseJsonWithNull(event);
            if (json?.source !== 'readyplayerme') {
                return;
            }

            // Susbribe to all events sent from Ready Player Me once frame is ready
            if (json.eventName === 'v1.frame.ready') {
                if (iframe.current === null) return;
                iframe.current.contentWindow.postMessage(
                    JSON.stringify({
                        target: 'readyplayerme',
                        type: 'subscribe',
                        eventName: 'v1.**'
                    }),
                    '*'
                    );
            }

            // Get avatar GLB URL
            if (json.eventName === 'v1.avatar.exported') {
                setLoading(true);
                setVirtualAvatarUrl(json.data.url);
                setCreateVirtualAvatar(false);
                const url = await renderModelThumbnail(json.data.url);
                setRpThumnailUrl(url);
                setLoading(false);

                // FIXME: somehow we need to emulate click to change avatar.
                // just use setOptions does not work
                rpAvatarEl.current.click();
            }
        };

        window.addEventListener('message', subscribe);

        return () => {
            window.removeEventListener('message', subscribe);
        }
    }, [options, rpThumnailUrl]);


    return (
        <Dialog
            className = 'virtual-background-dialog-content'
            hideCancelButton={ createVirtualAvatar? true : false }
            okKey = { 'virtualAvatar.apply' }
            onCancel = { cancelVirtualAvatar }
            onSubmit = { applyVirtualAvatar }
            submitDisabled={ createVirtualAvatar? true : (!options || loading || !previewIsLoaded) }
            width={createVirtualAvatar? 960 : 600}
            titleKey = { 'virtualAvatar.title' } >
            {createVirtualAvatar ? (
                <iframe src="https://fullbody.readyplayer.me/avatar?frameApi"
                    allow="camera *; microphone *"
                    ref={rpConfigVirtualAvatarIframe}
                    width="100%" height="600" />
            ) : (<React.Fragment>
                    <VirtualAvatarPreview
                        loadedPreview={loadedPreviewState}
                        options={options} />
                    <div className = 'virtual-background-content'>
                        {loading ? (
                            <div className = 'virtual-background-loading'>
                                <Spinner
                                    isCompleting = { false }
                                    size = 'small' />
                            </div>
                        ) : (
                            <div>
                                {<label
                                    aria-label={t('virtualAvatar.uploadImage')}
                                    className='file-upload-label'
                                    tabIndex={0}
                                            onClick={() => { setCreateVirtualAvatar(true)}} >
                                    <Icon
                                        className={'add-background'}
                                        size={20}
                                        src={IconPlusCircle} />
                                    {t('dialog.customAvatars')}
                                </label>}

                                <TouchmoveHack isModal = { true } style = {{ overflow: 'visible' }}>
                                    <div
                                        className = 'virtual-background-dialog'
                                        role = 'radiogroup'
                                        tabIndex = '-1'>
                                        <Tooltip
                                            content = { t('virtualAvatar.removeVirtualAvatar') }
                                            position = { 'top' }>
                                            <div
                                                aria-checked = { options.selectedVirtualAvatarUrl === 'none' }
                                                aria-label = { t('virtualAvatar.removeVirtualAvatar') }
                                                className = { options.selectedVirtualAvatarUrl === 'none' ? 'background-option none-selected'
                                                    : 'background-option virtual-background-none' }
                                                onClick = { removeVirtualAvatar }
                                                role = 'radio'
                                                tabIndex = { 0 } >
                                                {t('virtualAvatar.none')}
                                            </div>
                                        </Tooltip>
                                        {rpThumnailUrl && <Tooltip
                                            content={t('virtualAvatar.readyplayerAvatar')}
                                            position={'top'}>
                                            <img
                                                aria-checked={options.virtualAvatarType === 'readyplayer'}
                                                aria-label={t('virtualAvatar.readyplayerAvatar')}
                                                className={options.selectedVirtualAvatarUrl === rpVirtualAvatarUrl ? 'background-option thumbnail-selected' : 'background-option thumbnail'}
                                                onClick={setReadyplayerAvatar}
                                                role='radio'
                                                src={rpThumnailUrl}
                                                ref={e => {rpAvatarEl.current = e}}
                                                tabIndex={0} />
                                        </Tooltip>}
                                        {prebuildAvatars.map((avatar, index) => (
                                            <Tooltip
                                                content = { avatar.tooltip && t(`virtualAvatar.${avatar.tooltip}`) }
                                                key = { avatar.id }
                                                position = { 'top' }>
                                                <img
                                                    alt = { avatar.tooltip && t(`virtualAvatar.${avatar.tooltip}`) }
                                                    aria-checked={options.selectedVirtualAvatarUrl === avatar.modelUrl
                                                        && options.virtualAvatarType === "avatar" }
                                                    className = {
                                                        (options.selectedVirtualAvatarUrl === avatar.modelUrl && options.virtualAvatarType === "avatar")
                                                            ? 'background-option thumbnail-selected' : 'background-option thumbnail' }
                                                    data-imageid = { avatar.id }
                                                    onClick={ setPreviewVirtualAvatar }
                                                    onError = { onError }
                                                    role = 'radio'
                                                    src = { avatar.src }
                                                    tabIndex = { 0 } />
                                            </Tooltip>
                                        ))}
                                    </div>
                                    <div>
                                        {previewIsLoaded && <label
                                            aria-label={t('virtualBackground.uploadImage')}
                                            className='file-upload-label'
                                            htmlFor='file-upload'
                                            tabIndex={0} >
                                            <Icon
                                                className={'add-background'}
                                                size={20}
                                                src={IconPlusCircle} />
                                            {t('virtualBackground.addBackground')}
                                        </label>}
                                        <input
                                            accept='image/*'
                                            className='file-upload-btn'
                                            id='file-upload'
                                            onChange={uploadImage}
                                            type='file' />
                                    </div>
                                    {/* background */}
                                    <div className='virtual-background-dialog'
                                        role='radiogroup'
                                        tabIndex='-1'>
                                        <Tooltip
                                            content={t('virtualBackground.removeBackground')}
                                            position={'top'}>
                                            <div
                                                    aria-checked={options.selectedBackgroundId === 'none'}
                                                aria-label={t('virtualBackground.removeBackground')}
                                                    className={options.selectedBackgroundId === 'none' ? 'background-option none-selected'
                                                    : 'background-option virtual-background-none'}
                                                onClick={removeAvatarBackground}
                                                role='radio'
                                                tabIndex={0} >
                                                {t('virtualBackground.none')}
                                            </div>
                                        </Tooltip>
                                        {backgroundImages.map((image, index) => (
                                            <Tooltip
                                                content={image.tooltip && t(`virtualBackground.${image.tooltip}`)}
                                                key={image.id}
                                                position={'top'}>
                                                <img
                                                    alt={image.tooltip && t(`virtualBackground.${image.tooltip}`)}
                                                    aria-checked={options.selectedBackgroundId === image.id}
                                                    className={
                                                        options.selectedBackgroundId === image.id
                                                            ? 'background-option thumbnail-selected' : 'background-option thumbnail'}
                                                    data-imageid={image.id}
                                                    onClick={setImageBackground}
                                                    onError={onError}
                                                    role='radio'
                                                    src={image.src}
                                                    tabIndex={0} />
                                            </Tooltip>
                                        ))}
                                        {remoteImages.map((image, index) => (
                                            <div
                                                className={'thumbnail-container'}
                                                key={image._id}>
                                                <img
                                                    alt={t('virtualBackground.uploadedImage', { index: index + 1 })}
                                                    aria-checked={options.selectedBackgroundId === image._id}
                                                    className={options.selectedBackgroundId === image._id
                                                        ? 'background-option thumbnail-selected' : 'background-option thumbnail'}
                                                    data-imageid={image._id}
                                                    onClick={setUploadedImageBackground}
                                                    onError={onError}
                                                    role='radio'
                                                    src={getRemoteImageUrl(image, 'ld')}
                                                    tabIndex={0} />
                                                {!image.isPublic && (
                                                    <Icon
                                                        ariaLabel={t('virtualBackground.deleteImage')}
                                                        className={'delete-image-icon'}
                                                        data-imageid={image._id}
                                                        onClick={removeBackground}
                                                        role='button'
                                                        size={15}
                                                        src={IconCancelSelection}
                                                        tabIndex={0} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </TouchmoveHack>
                            </div>
                        )}
                    </div>
                </React.Fragment>)}
        </Dialog>
    );
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code VirtualAvatarDialog} component.
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
        _virtualAvatar: state['features/virtual-avatar'],
        _virtualBackground: state['features/virtual-background'],
    };
}

export default translate(connect(_mapStateToProps)(VirtualAvatar));
