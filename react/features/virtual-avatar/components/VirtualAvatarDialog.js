// @flow

import Spinner from '@atlaskit/spinner';
import axios from 'axios';
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { getAuthUrl } from '../../../api/url';
import { Dialog, hideDialog, openDialog } from '../../base/dialog';
import { Icon, IconCancelSelection, IconPlusCircle, IconShareDesktop } from '../../base/icons';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { updateSettings } from '../../base/settings';
import { Tooltip } from '../../base/tooltip';
import { getLocalVideoTrack } from '../../base/tracks';
import TouchmoveHack from '../../chat/components/web/TouchmoveHack';
import {
    virtualAvatarEnabled,
    setVirtualAvatar,
    toggleVirtualAvatarEffect,
    virtualAvatarTrackChanged
} from '../actions';
import { toDataURL } from '../functions';
import logger from '../logger';
import * as zip from "@zip.js/zip.js";

import VirtualAvatarPreview from './VirtualAvatarPreview';

const images = [
    {
        tooltip: 'image1',
        id: '1',
        src: 'images/virtual-avatar/boy-4.jpg',
        modelUrl: 'https://cdn.jsdelivr.net/gh/tu-nv/vrm_models/boy-4.vrm'
    },

    {
        tooltip: 'image2',
        id: '2',
        src: 'images/virtual-avatar/girl-1.jpg',
        modelUrl: 'https://cdn.jsdelivr.net/gh/tu-nv/vrm_models/girl-1.vrm'
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
    _virtualSource,
    dispatch,
    t
}: Props) {
    const [ previewIsLoaded, setPreviewIsLoaded ] = useState(false);
    const [ origin ] = useState(_virtualAvatar);
    const [ options, setOptions ] = useState(_virtualAvatar);
    const [ loading, setLoading ] = useState(false);
    const [realisticAvatarBlob, setRealisticAvatarBlob] = useState(null);


    const removeVirtualAvatar = useCallback(async e => {
        setOptions({
            enabled: false,
            selectedVirtualAvatarUrl: 'none'
        });
        logger.info('Uploaded image setted for virtual avatar preview!');
    }, [ ]);


    const setPreviewVirtualAvatar = useCallback(async e => {
        const imageId = e.currentTarget.getAttribute('data-imageid');
        const image = images.find(img => img.id === imageId);

        if (image) {
            const url = await toDataURL(image.src);

            setOptions({
                virtualAvatarType: 'image',
                enabled: true,
                selectedVirtualAvatarUrl: image.modelUrl,
                url: url
            });
            logger.info('Image setted for virtual avatar preview!');

            setLoading(false);
        }
    }, []);

    const setRealisticAvatar = useCallback(async e => {
        console.log(realisticAvatarBlob);
        if (realisticAvatarBlob !== null) {
            setOptions({
                virtualAvatarType: 'realistic',
                enabled: true,
                selectedVirtualAvatarUrl: realisticAvatarBlob,
                url: url
            });
            logger.info('realistic avatar setted for virtual avatar preview!');

            setLoading(false);
        }
    }, []);


    const applyVirtualAvatar = useCallback(async () => {
        setLoading(true);
        await dispatch(toggleVirtualAvatarEffect(options, _jitsiTrack));
        setLoading(false);

        // Set x scale to default value.
        dispatch(updateSettings({
            localFlipX: true
        }));

        dispatch(hideDialog());
        logger.info(`Virtual avatar type: '${typeof options.virtualAvatarType === 'undefined'
            ? 'none' : options.virtualAvatarType}' applied!`);
        dispatch(virtualAvatarTrackChanged());
    }, [ dispatch, options, _localFlipX ]);

    const cancelVirtualAvatar = useCallback(async () => {
        await dispatch(virtualAvatarEnabled(origin.virtualAvatarEffectEnabled));
        const origin_fixed = {
            ...origin,
            url: origin.virtualSource
        }
        await dispatch(setVirtualAvatar(origin_fixed));
    }, [ dispatch, origin ]);

    const loadedPreviewState = useCallback(async loaded => {
        await setPreviewIsLoaded(loaded);
    });

    const getAvatarModel = async form => {
        const baseUrl = "https://api.avatarsdk.com";
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };
        const resp1 = await axios.post(`${baseUrl}/players/`, null, config);
        debugger;
    };

    const uploadPhoto = useCallback(async e => {
        // https://stackoverflow.com/questions/49500255/warning-this-synthetic-event-is-reused-for-performance-reasons-happening-with
        const imageFiles = e.target.files;
        const form = new FormData();
        form.append('photo', imageFiles[0]);
        // clear prev image after upload
        e.target.value = '';
        setLoading(true);

        const sleep = ms => new Promise(r => setTimeout(r, ms));
        let resp = null;

        const avatarServer = axios.create({
            baseURL: 'https://api.avatarsdk.com',
            timeout: 10000,
            // headers: { 'Authorization': 'Bearer KYGpv4suczjJrEW2JAU7vQoz2S6lgH', 'X-PlayerUID': "29b29ab9-5734-439c-ab79-b91182e56c23"}
            headers: { 'Authorization': 'Bearer KYGpv4suczjJrEW2JAU7vQoz2S6lgH'}
        });

        /* create player id */
        resp = await avatarServer.post('/players/');
        avatarServer.defaults.headers['X-PlayerUID'] = resp.data.code;

        /* upload avatar photo */
        const parameters = {
            "model_info": {
                "plus": [
                    "gender",
                    "age",
                    "race"
                ]
            },
            "additional_textures": {
                "plus": ["lips_mask"]
            },
            "blendshapes": {
                "base": ["mobile_51"]
            }
        };
        form.append('parameters', JSON.stringify(parameters));

        const export_parameters = {
                "format": "glb",
                "additional_textures": ["lips_mask"],
                "embed_textures": true,
                "blendshapes": {
                    "list": ["mobile_51"]
                }
            };
        form.append('export_parameters', JSON.stringify(export_parameters));

        form.append('pipeline', "head_1.2");
        form.append('pipeline_subtype', "base/mobile");
        form.append('name', "dummy text");

        resp = await avatarServer.post('/avatars/', form);
        const avatarCode = resp.data.code;

        let avatarStatus = null;
        do {
            await sleep(1000);
            resp = await avatarServer.get(`/avatars/${avatarCode}/`);
            avatarStatus = resp.data.status;
        } while (avatarStatus !== "Completed");

        /* check avatar export */
        let avatarExportStatus = null;
        do {
            await sleep(1000);
            resp = await avatarServer.get(`/avatars/${avatarCode}/exports/`);
            avatarExportStatus = resp.data[0].status;
        } while (avatarExportStatus !== "Completed");
        const exportCode = resp.data[0].code;

        /* download the exported 3d model */
        resp = await avatarServer.get(`/avatars/${avatarCode}/exports/${exportCode}/files/avatar/file/`, { responseType: 'blob' });
        // resp = await avatarServer.get("/avatars/ad7cb7e9-13fa-4922-99f5-250d291d4e9d/exports/fc308647-b73b-477a-a51a-798a0b1b2f9c/files/avatar/file/", { responseType: 'blob' });
        const modelZip = new Blob([resp.data], { type: 'application/zip' });
        // hardcode entry order: /avatar, /avatar/model.glb
        const modelZipReader = (new zip.ZipReader(new zip.BlobReader(modelZip)));
        const entries = await modelZipReader.getEntries();
        const modelBlobURL = URL.createObjectURL(await entries[1].getData(new zip.BlobWriter()));

        setRealisticAvatarBlob(modelBlobURL);
        console.log(modelBlobURL, realisticAvatarBlob);

        setOptions({
            virtualAvatarType: 'realistic',
            enabled: true,
            selectedVirtualAvatarUrl: modelBlobURL,
            url: "none"
        });

        // console.log(entries);

        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = modelBlobURL;
        a.download = "model.glb";
        a.click();

        // console.log(modelZip);
        // resp = await avatarServer.get("/avatars/3301c321-d19c-4845-8722-d28d28133536/exports/");
        // console.log(resp);
        // debugger;
        setLoading(false);
    }, []);

    return (
        <Dialog
            className = 'virtual-background-dialog-content'
            hideCancelButton = { false }
            okKey = { 'virtualAvatar.apply' }
            onCancel = { cancelVirtualAvatar }
            onSubmit = { applyVirtualAvatar }
            submitDisabled = { !options || loading || !previewIsLoaded }
            titleKey = { 'virtualAvatar.title' } >
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
                        {previewIsLoaded && <label
                            aria-label={t('virtualAvatar.uploadPhoto')}
                            className='file-upload-label'
                            htmlFor='file-upload'
                            tabIndex={0} >
                            <Icon
                                className={'add-background'}
                                size={20}
                                src={IconPlusCircle} />
                                {t('virtualAvatar.addPhoto')}
                        </label>}
                        <input
                            accept='image/*'
                            className='file-upload-btn'
                            id='file-upload'
                            onChange={uploadPhoto}
                            type='file' />
                        <TouchmoveHack isModal = { true } style = {{ overflow: 'visible' }}>
                            <div
                                className = 'virtual-background-dialog'
                                role = 'radiogroup'
                                tabIndex = '-1'>

                                <Tooltip
                                    content={t('virtualAvatar.removeVirtualAvatar')}
                                    position={'top'}>
                                    <div
                                        aria-checked={options.selectedVirtualAvatarUrl === 'none'}
                                        aria-label={t('virtualAvatar.removeVirtualAvatar')}
                                        className={options.selectedVirtualAvatarUrl === 'none' ? 'background-option none-selected'
                                            : 'background-option virtual-background-none'}
                                            onClick={removeVirtualAvatar}
                                        role='radio'
                                        tabIndex={0} >
                                        {t('virtualAvatar.none')}
                                    </div>
                                </Tooltip>

                                <Tooltip
                                    content = { t('virtualAvatar.realisticAvatar') }
                                    position = { 'top' }>
                                    <div
                                        aria-checked={options.virtualAvatarType === 'realistic' }
                                        aria-label = { t('virtualAvatar.realisticAvatar') }
                                        className = { options.selectedVirtualAvatarUrl === 'none' ? 'background-option none-selected'
                                            : 'background-option virtual-background-none' }
                                        onClick = { setRealisticAvatar }
                                        role = 'radio'
                                        tabIndex = { 0 } >
                                    </div>
                                </Tooltip>

                                {images.map((image, index) => (
                                    <Tooltip
                                        content = { image.tooltip && t(`virtualAvatar.${image.tooltip}`) }
                                        key = { image.id }
                                        position = { 'top' }>
                                        <img
                                            alt = { image.tooltip && t(`virtualAvatar.${image.tooltip}`) }
                                            aria-checked={options.selectedVirtualAvatarUrl === image.modelUrl
                                                || options.selectedVirtualAvatarUrl === image.modelUrl }
                                            className = {
                                                options.selectedVirtualAvatarUrl === image.modelUrl
                                                    ? 'background-option thumbnail-selected' : 'background-option thumbnail' }
                                            data-imageid = { image.id }
                                            onClick={ setPreviewVirtualAvatar }
                                            onError = { onError }
                                            role = 'radio'
                                            src = { image.src }
                                            tabIndex = { 0 } />
                                    </Tooltip>
                                ))}
                            </div>
                        </TouchmoveHack>
                    </div>
                )}
            </div>
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
        _virtualSource: state['features/virtual-avatar'].virtualSource
    };
}

export default translate(connect(_mapStateToProps)(VirtualAvatar));
