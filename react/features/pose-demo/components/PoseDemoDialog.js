// @flow

import Spinner from '@atlaskit/spinner';
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { Dialog, hideDialog, openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { Switch } from '../../base/react';
import { getLocalVideoTrack } from '../../base/tracks';
import { toggle3DView, togglePoseEffect, toggleViewOnCam } from '../actions';


type Props = {
    conference: Object,

    _enabled: Boolean,

    _viewOnCam: Boolean,

    _view3D: Boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

const onError = event => {
    event.target.style.display = 'none';
};


/**
 * Renders virtual background dialog.
 *
 * @returns {ReactElement}
 */
function PoseDemo({
    conference,
    _enabled,
    _viewOnCam,
    _view3D,
    _jitsiTrack,
    dispatch,
    t
}: Props) {
    const [ loading, setLoading ] = useState(false);
    const [ enabled, setEnable ] = useState(_enabled);
    const [ viewOnCam, setViewOnCam ] = useState(_viewOnCam);
    const [ view3D, setView3D ] = useState(_view3D);

    /**
     * Loads images from server.
     */
    useEffect(() => {
        
    }, []);

    const cancelPoseDemo = useCallback(async () => {
        dispatch(hideDialog());
    }, [ dispatch ]);

    const applyPoseDemo = (() => {
        if(enabled !== _enabled){
            dispatch(togglePoseEffect({
                enabled: enabled,
                view3D: view3D,
                viewOnCam: viewOnCam
            }, _jitsiTrack));
        }
        else {
            if(enabled && view3D !== _view3D) {
                dispatch(toggle3DView(view3D));
            }

            if(enabled && viewOnCam !== _viewOnCam) {
                dispatch(toggleViewOnCam(viewOnCam));
            }
        }

        dispatch(hideDialog());
    });

    const onToggleEnable = (() => {
        const newValue = !enabled
        setEnable(newValue);
        setViewOnCam(newValue);
    });

    const onToggleView3D = (() => {
        const newValue = !view3D
        setView3D(newValue);
    });

    const onToggleViewOnCam = (() => {
        const newValue = !viewOnCam
        setViewOnCam(newValue);
    });

    return (
        <Dialog
            hideCancelButton = { false }
            okKey = { 'posedemo.apply' }
            onCancel = { cancelPoseDemo }
            onSubmit = { applyPoseDemo }
            submitDisabled = { loading }
            titleKey = { 'posedemo.title' }
            width = 'small' >
            <div className = 'posedemo-dialog'>
                {loading ? (
                    <div className = 'posedemo-spinner'>
                    <Spinner
                        isCompleting = { false }
                        size = 'small' />
                    </div>
                ) : (
                    <>
                    <div className = 'posedemo-section'>
                        <p
                            className = 'description'
                            role = 'banner'>
                            { t('posedemo.enableDialogText') }
                        </p>
                        <div className = 'control-row'>
                            <label htmlFor = 'posedemo-section-switch'>
                                { t('posedemo.toggleLabel') }
                            </label>
                            <Switch
                                id = 'posedemo-section-switch'
                                onValueChange = { onToggleEnable }
                                value = { enabled } />
                        </div>
                    </div>
                    {
                        enabled?
                        <div className = 'stt-section'>
                            <div className = 'control-row'>
                                <label htmlFor = 'posedemo-section-switch'>
                                    { t('posedemo.toggle3DLabel') }
                                </label>
                                <Switch
                                    id = 'posedemo-section-switch'
                                    onValueChange = { onToggleView3D }
                                    value = { view3D } />
                            </div>
                            <div className = 'control-row'>
                                <label htmlFor = 'posedemo-section-switch'>
                                    { t('posedemo.toggleOnCamLabel') }
                                </label>
                                <Switch
                                    id = 'posedemo-section-switch'
                                    onValueChange = { onToggleViewOnCam }
                                    value = { viewOnCam } />
                            </div>
                        </div> : null
                    }
                    </>
                )}
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
    const conference = state['features/base/conference'].conference;
    const enabled = state['features/posedemo'].enabled;
    const viewOnCam = state['features/posedemo'].viewOnCam;
    const view3D = state['features/posedemo'].view3D;

    return {
        conference: conference,
        _enabled: enabled,
        _viewOnCam: viewOnCam,
        _view3D: view3D,
        _jitsiTrack: getLocalVideoTrack(state['features/base/tracks'])?.jitsiTrack,
    };
}

export default translate(connect(_mapStateToProps)(PoseDemo));