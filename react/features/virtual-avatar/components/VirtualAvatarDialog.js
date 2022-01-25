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
        src: 'images/virtual-avatar/cartoon_boy.png'
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


    const removeVirtualAvatar = useCallback(async e => {
        setOptions({
            enabled: false,
            selectedThumbnail: 'none'
        });
        logger.info('Uploaded image setted for virtual avatar preview!');
    }, [ ]);


    const setVirtualAvatar = useCallback(async e => {
        const imageId = e.currentTarget.getAttribute('data-imageid');
        const image = images.find(img => img.id === imageId);

        if (image) {
            const url = await toDataURL(image.src);

            setOptions({
                virtualAvatarType: 'image',
                enabled: true,
                url,
                selectedThumbnail: image.id
            });
            logger.info('Image setted for virtual avatar preview!');

            setLoading(false);
        }
    }, []);


    const applyVirtualAvatar = useCallback(async () => {
        setLoading(true);
        await dispatch(toggleVirtualAvatarEffect(options, _jitsiTrack));
        await setLoading(false);

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

    return (
        <Dialog
            className = 'virtual-avatar-dialog-content'
            hideCancelButton = { false }
            okKey = { 'virtualAvatar.apply' }
            onCancel = { cancelVirtualAvatar }
            onSubmit = { applyVirtualAvatar }
            submitDisabled = { !options || loading || !previewIsLoaded }
            titleKey = { 'virtualAvatar.title' } >
            <div className = 'virtual-background-content'>
                <VirtualAvatarPreview
                    loadedPreview={loadedPreviewState}
                    options={options} />
                {loading ? (
                    <div className = 'virtual-background-loading'>
                        <Spinner
                            isCompleting = { false }
                            size = 'small' />
                    </div>
                ) : (
                    <div>
                        <TouchmoveHack isModal = { true } style = {{ overflow: 'visible' }}>
                            <div
                                className = 'virtual-background-dialog'
                                role = 'radiogroup'
                                tabIndex = '-1'>
                                <Tooltip
                                    content = { t('virtualAvatar.removeVirtualAvatar') }
                                    position = { 'top' }>
                                    <div
                                        aria-checked = { options.selectedThumbnail === 'none' }
                                        aria-label = { t('virtualAvatar.removeVirtualAvatar') }
                                        className = { options.selectedThumbnail === 'none' ? 'background-option none-selected'
                                            : 'background-option virtual-background-none' }
                                        onClick = { removeVirtualAvatar }
                                        role = 'radio'
                                        tabIndex = { 0 } >
                                        {t('virtualAvatar.none')}
                                    </div>
                                </Tooltip>
                                {images.map((image, index) => (
                                    <Tooltip
                                        content = { image.tooltip && t(`virtualAvatar.${image.tooltip}`) }
                                        key = { image.id }
                                        position = { 'top' }>
                                        <img
                                            alt = { image.tooltip && t(`virtualAvatar.${image.tooltip}`) }
                                            aria-checked = { options.selectedThumbnail === image.id
                                                || options.selectedThumbnail === image.id }
                                            className = {
                                                options.selectedThumbnail === image.id
                                                    ? 'background-option thumbnail-selected' : 'background-option thumbnail' }
                                            data-imageid = { image.id }
                                            onClick = { setVirtualAvatar }
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
