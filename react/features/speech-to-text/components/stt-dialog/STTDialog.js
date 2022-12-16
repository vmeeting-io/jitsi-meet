// @flow

import React, { useState, useEffect } from 'react';

import { Dialog } from '../../../base/dialog';
import { Switch } from '../../../base/react';
import { connect } from '../../../base/redux';
import { translate } from '../../../base/i18n';
import { getLocalParticipant } from '../../../base/participants';

import { 
    toggleSTT,
    toggleSTTTranslation,
    toggleSTTMinutes
} from '../../actions';
import { STT_COMMAND } from '../../../base/conference';

import Button from '@atlaskit/button/standard-button';

type Props = {
    _conference: Object,

    _sttEnabled: Boolean,

    _localParticipant: Object,

    t: function,

    dispatch: function,
};

/**
 * Component that renders the stt options dialog.
 *
 * @returns {React$Element<any>}
 */
function STTDialog({
    _conference,
    _sttEnabled,
    _localParticipant,
    t,
    dispatch
}: Props) {
    const [enabled, setEnabled] = useState(_sttEnabled);
    const [translationEnabled, setTranslationEnabled] = useState(false);
    const [minutesEnabled, setMinutesEnabled] = useState(false);

    const onToggleEnable = () => {
        const targetValue = !enabled;
        setEnabled(targetValue);
        _conference.sendCommandOnce(STT_COMMAND, { value: targetValue });
        //dispatch(toggleSTT(targetValue));
    }

    const onToggleTranslation = () => {
        const targetValue = !translationEnabled;
        setTranslationEnabled(targetValue);
        dispatch(toggleSTTTranslation(targetValue));
    }

    const onToggleMinutes = () => {
        const targetValue = !minutesEnabled;
        setMinutesEnabled(targetValue);
        dispatch(toggleSTTMinutes(targetValue));
    }

    const onClickTest = () => {
        if (_conference) {
            _conference.sendEndpointMessage('', {
                type: 'transcription-result',
                participant: { name: _localParticipant.name },
                message_id: 'test123',
                transcript: [{text: 'This is test message'}],
                is_interim: false,
                stability: 1.0
            });
        }
    }

    return (
        <Dialog
            hideCancelButton = { true }
            submitDisabled = { true }
            titleKey = 'stt.header'
            width = { 'small' }>
            <div className = 'stt-dialog'>
                <div className = 'stt-section'>
                    <p
                        className = 'description'
                        role = 'banner'>
                        { t('stt.featureDesc') }
                    </p>
                    <div className = 'control-row'>
                        <label htmlFor = 'stt-enable-section-switch'>
                            { t('stt.toggleLabel') }
                        </label>
                        <Switch
                            id = 'stt-enable-section-switch'
                            onValueChange = { onToggleEnable }
                            value = { enabled } />
                    </div>
                </div>
                {
                    enabled?
                        <div className = 'stt-section'>
                            <div className = 'control-row'>
                                <label htmlFor = 'stt-translation-section-switch'>
                                    { t('stt.toggleTranslation') }
                                </label>
                                <Switch
                                    id = 'stt-translation-section-switch'
                                    onValueChange = { onToggleTranslation }
                                    value = { translationEnabled } disabled/>
                            </div>
                            <div className = 'control-row'>
                                <label htmlFor = 'stt-minutes-section-switch'>
                                    { t('stt.toggleMinutes') }
                                </label>
                                <Switch
                                    id = 'stt-minutes-section-switch'
                                    onValueChange = { onToggleMinutes }
                                    value = { minutesEnabled } disabled/>
                            </div>
                        </div> : null
                }
            </div>
        </Dialog>
    );
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code STTDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function mapStateToProps(state) {
    const {
        conference
    } = state['features/base/conference'];
    const {
        _sttEnabled
    } = state['features/stt'];
    return {
        _conference: conference,
        _sttEnabled: _sttEnabled,
        _localParticipant: getLocalParticipant(state)
    };
}

export default translate(connect(mapStateToProps)(STTDialog));
