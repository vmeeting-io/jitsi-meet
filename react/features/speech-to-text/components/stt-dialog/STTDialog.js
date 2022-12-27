// @flow

import React, { useState, useEffect } from 'react';
import Spinner from '@atlaskit/spinner';
import DropdownMenu, {
    DropdownItem,
    DropdownItemGroup
} from '@atlaskit/dropdown-menu';
import { Dialog } from '../../../base/dialog';
import { Switch } from '../../../base/react';
import { connect } from '../../../base/redux';
import { i18next, translate } from '../../../base/i18n';
import { isLocalParticipantModerator } from '../../../base/participants';

import { 
    toggleSTTTranslation,
    changeSTTTargetLanguage,
    changeSubtitleFontSize
} from '../../actions';
import { STT_COMMAND } from '../../../base/conference';

type Props = {
    _conference: Object,

    _sttEnabled: Boolean,

    _isLocalModerator: Boolean,

    _sttOn: Boolean,

    _targetLanguage: String,

    _fontSize: String,

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
    _translationEnabled,
    _isLocalModerator,
    _sttOn,
    _targetLanguage,
    _fontSize,
    t,
    dispatch
}: Props) {
    const [enabled, setEnabled] = useState(_sttEnabled);
    const [targetLanguage, setTargetLanguage] = useState(_targetLanguage || i18next.language);
    const [fontSize, setFontSize] = useState(_fontSize || 'small');
    const [translationEnabled, setTranslationEnabled] = useState(_translationEnabled || false);

    const onToggleEnable = () => {
        const targetValue = !enabled;
        setEnabled(targetValue);
        _conference.sendCommandOnce(STT_COMMAND, { value: targetValue });
    }

    const onChangeTargetLanguage = (e) => {
        const target = e.currentTarget.getAttribute('data-lang');
        setTargetLanguage(target);
        dispatch(changeSTTTargetLanguage(target));
    }

    const onChangeFontSize = (e) => {
        const target = e.currentTarget.getAttribute('data-fontsize');
        setFontSize(target);
        dispatch(changeSubtitleFontSize(target));
    }

    const onToggleTranslation = () => {
        const targetValue = !translationEnabled;
        setTranslationEnabled(targetValue);
        dispatch(toggleSTTTranslation(targetValue));
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
                        { _isLocalModerator? t('stt.featureDesc') : t('stt.featureDescP') }
                    </p>
                    { _isLocalModerator && 
                    <div className = 'control-row'>
                        <label htmlFor = 'stt-enable-section-switch'>
                            { t('stt.toggleLabel') }
                        </label>
                        <Switch
                            id = 'stt-enable-section-switch'
                            onValueChange = { onToggleEnable }
                            value = { enabled } />
                    </div>}
                </div>
                {
                    enabled?
                        _sttOn? 
                        <div className = 'stt-section'>
                            <div className = 'control-row'>
                                <label htmlFor = 'stt-target-language'>
                                    { t('stt.currentTargetLanguage') }
                                </label>
                                <DropdownMenu
                                    shouldFitContainer = { true }
                                    trigger = {targetLanguage === 'ko'? '한국어' : 'English'}
                                    triggerButtonProps = {{
                                        shouldFitContainer: true,
                                        id: 'stt-dropdown-id'
                                    }}
                                    triggerType = 'button'>
                                    <DropdownItemGroup>
                                        <DropdownItem
                                            data-lang='ko'
                                            key='ko'
                                            isSelected = {'ko' === targetLanguage}
                                            onClick={onChangeTargetLanguage}>
                                            한국어
                                        </DropdownItem>
                                        <DropdownItem
                                            data-lang='en'
                                            key='en'
                                            isSelected = {'en' === targetLanguage}
                                            onClick={onChangeTargetLanguage}>
                                            English
                                        </DropdownItem>
                                    </DropdownItemGroup>
                                </DropdownMenu>
                            </div>
                            <div className = 'control-row'>
                                <label htmlFor = 'stt-target-language'>
                                    { t('stt.fontSize') }
                                </label>
                                <DropdownMenu
                                    shouldFitContainer = { true }
                                    trigger = {t(`stt.font_${fontSize}`)}
                                    triggerButtonProps = {{
                                        shouldFitContainer: true,
                                        id: 'stt-fs-dropdown-id'
                                    }}
                                    triggerType = 'button'>
                                    <DropdownItemGroup>
                                        <DropdownItem
                                            data-fontsize='small'
                                            key='small'
                                            isSelected = {'small' === fontSize}
                                            onClick={onChangeFontSize}>
                                            {t('stt.font_small')}
                                        </DropdownItem>
                                        <DropdownItem
                                            data-fontsize='medium'
                                            key='medium'
                                            isSelected = {'medium' === fontSize}
                                            onClick={onChangeFontSize}>
                                            {t('stt.font_medium')}
                                        </DropdownItem>
                                        <DropdownItem
                                            data-fontsize='large'
                                            key='large'
                                            isSelected = {'large' === fontSize}
                                            onClick={onChangeFontSize}>
                                            {t('stt.font_large')}
                                        </DropdownItem>
                                    </DropdownItemGroup>
                                </DropdownMenu>
                            </div>
                            <div className = 'control-row'>
                                <label htmlFor = 'stt-translation-section-switch'>
                                    { t('stt.toggleTranslation') }
                                </label>
                                <Switch
                                    id = 'stt-translation-section-switch'
                                    onValueChange = { onToggleTranslation }
                                    value = { translationEnabled }/>
                            </div>
                        </div> : 
                        <div className = 'stt-spinner'>
                            <Spinner
                                isCompleting = { false }
                                size = 'medium' />
                        </div>
                     : null
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
        _sttEnabled,
        _recorder,
        _targetLanguage,
        _fontSize,
        _translationEnabled
    } = state['features/stt'];
    const isModerator = isLocalParticipantModerator(state);
    return {
        _conference: conference,
        _sttEnabled: _sttEnabled,
        _translationEnabled: _translationEnabled,
        _isLocalModerator: isModerator,
        _sttOn: _recorder? true : false,
        _targetLanguage: _targetLanguage,
        _fontSize: _fontSize
    };
}

export default translate(connect(mapStateToProps)(STTDialog));
