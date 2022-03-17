// @flow

import Spinner from '@atlaskit/spinner';
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { getAuthUrl } from '../../../api/url';
import { Dialog, hideDialog, openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { updateSettings } from '../../base/settings';
import { Tooltip } from '../../base/tooltip';
import { getLocalVideoTrack } from '../../base/tracks';
import TouchmoveHack from '../../chat/components/web/TouchmoveHack';
import { Icon, IconCancelSelection, IconPlusCircle, IconShareDesktop } from '../../base/icons';
import {
    virtualAvatarEnabled,
    setVirtualAvatar,
    toggleVirtualAvatarEffect,
    virtualAvatarTrackChanged
} from '../actions';
import { toDataURL } from '../functions';
import logger from '../logger';

import VirtualAvatarPreview from './VirtualAvatarPreview';

const images = [
    {
        tooltip: 'image1',
        id: '1',
        src: 'images/virtual-avatar/boy-4.jpg',
        modelUrl: 'https://d1a370nemizbjq.cloudfront.net/ada1a7fd-9c61-41ab-98c0-56118dd544e0.glb'
    },

    {
        tooltip: 'image2',
        id: '2',
        src: 'images/virtual-avatar/girl-1.jpg',
        modelUrl: 'https://d1a370nemizbjq.cloudfront.net/ad8a6543-4f4d-461e-a6b6-add022f072c9.glb'
    },

    {
        tooltip: 'image3',
        id: '3',
        src: 'images/virtual-avatar/girl-1.jpg',
        modelUrl: 'https://d1a370nemizbjq.cloudfront.net/ad8a6543-4f4d-461e-a6b6-add022f072c9.glb'
    },
    {
        tooltip: 'image4',
        id: '4',
        src: 'images/virtual-avatar/girl-1.jpg',
        modelUrl: 'https://d1a370nemizbjq.cloudfront.net/ad8a6543-4f4d-461e-a6b6-add022f072c9.glb'
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
    const [createVirtualAvatar, setCreateVirtualAvatar ] = useState(false);
    const [virtualAvatarUrl, setVirtualAvatarUrl ] = useState(null);

    let iframe;


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
                url: "none"
            });
            logger.info('Image setted for virtual avatar preview!');

            setLoading(false);
        }
    }, []);

    const setReadyplayerAvatar = useCallback(async e => {
        setOptions({
            virtualAvatarType: 'readyplayer',
            enabled: true,
            selectedVirtualAvatarUrl: virtualAvatarUrl,
            url: "none"
        });
        logger.info('Image setted for virtual avatar preview!');

        setLoading(false);

    }, [virtualAvatarUrl]);


    const applyVirtualAvatar = useCallback(async () => {
        setLoading(true);
        await dispatch(toggleVirtualAvatarEffect(options, _jitsiTrack));
        setLoading(false);

        // Set x scale to default value.
        dispatch(updateSettings({
            localFlipX: false
        }));

        dispatch(hideDialog());
        logger.info(`Virtual avatar type: '${typeof options.virtualAvatarType === 'undefined'
            ? 'none' : options.virtualAvatarType}' applied!`);
        dispatch(virtualAvatarTrackChanged());
    }, [ dispatch, options, _localFlipX ]);

    const cancelVirtualAvatar = useCallback(async () => {
        const originOptions = {
            virtualAvatarType: origin.virtualAvatarType,
            enabled: origin.virtualAvatarEffectEnabled,
            selectedVirtualAvatarUrl: origin.selectedVirtualAvatarUrl,
            url: "none"
        }
        await dispatch(toggleVirtualAvatarEffect(originOptions, _jitsiTrack));
        dispatch(updateSettings({
            localFlipX: origin.virtualAvatarEffectEnabled? false : _localFlipX
        }));
        await dispatch(virtualAvatarTrackChanged());
    }, [dispatch, origin, options, _localFlipX ]);

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

    const configVirtualAvatarIframe = _iframe => {
        if (_iframe === null) return;
        iframe = _iframe;

        const subscribe = event => {
            const json = parseJsonWithNull(event);
            if (json?.source !== 'readyplayerme') {
                return;
            }

            // Susbribe to all events sent from Ready Player Me once frame is ready
            if (json.eventName === 'v1.frame.ready') {
                iframe.contentWindow.postMessage(
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
                setVirtualAvatarUrl(json.data.url);

                // setOptions({
                //     virtualAvatarType: 'readyplayer',
                //     enabled: true,
                //     selectedVirtualAvatarUrl: json.data.url,
                //     url: json.data.url
                // });

                setCreateVirtualAvatar(false);
                setLoading(false);
            }
        }

        window.addEventListener('message', subscribe);
    }

    return (
        <Dialog
            className = 'virtual-background-dialog-content'
            hideCancelButton = { false }
            okKey = { 'virtualAvatar.apply' }
            onCancel = { cancelVirtualAvatar }
            onSubmit = { applyVirtualAvatar }
            submitDisabled = { !options || loading || !previewIsLoaded }
            width={createVirtualAvatar? 960 : 600}
            titleKey = { 'virtualAvatar.title' } >
            {createVirtualAvatar ? (
                <iframe src="https://fullbody.readyplayer.me/avatar?frameApi"
                    allow="camera *; microphone *"
                    ref={iframe => {configVirtualAvatarIframe(iframe)}}
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
                                    aria-label={t('virtualAvatar.uploadPhoto')}
                                    className='file-upload-label'
                                    tabIndex={0}
                                            onClick={() => { setCreateVirtualAvatar(true)}} >
                                    <Icon
                                        className={'add-background'}
                                        size={20}
                                        src={IconPlusCircle} />
                                    {t('Custom Avatars')}

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
                                        {virtualAvatarUrl !== null && <Tooltip
                                            content={t('virtualAvatar.readyplayerAvatar')}
                                            position={'top'}>
                                            <div
                                                    aria-checked={options.virtualAvatarType === 'readyplayer'}
                                                    aria-label={t('virtualAvatar.readyplayerAvatar')}
                                                    className={options.virtualAvatarType === 'readyplayer' ? 'background-option blur-selected'
                                                        : 'background-option blur'}
                                                    onClick={setReadyplayerAvatar}
                                                role='radio'
                                                tabIndex={0} >
                                                {t('Custom Avatar')}
                                            </div>
                                        </Tooltip>}
                                        {images.map((image, index) => (
                                            <Tooltip
                                                content = { image.tooltip && t(`virtualAvatar.${image.tooltip}`) }
                                                key = { image.id }
                                                position = { 'top' }>
                                                <img
                                                    alt = { image.tooltip && t(`virtualAvatar.${image.tooltip}`) }
                                                    aria-checked={options.selectedVirtualAvatarUrl === image.modelUrl
                                                        && options.virtualAvatarType === "image" }
                                                    className = {
                                                        (options.selectedVirtualAvatarUrl === image.modelUrl && options.virtualAvatarType === "image")
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
        _virtualSource: state['features/virtual-avatar'].virtualSource
    };
}

export default translate(connect(_mapStateToProps)(VirtualAvatar));
