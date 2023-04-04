// @flow

import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
import { getAuthUrl } from '../../../../api/url';
import { Icon, IconRefresh } from '../../../base/icons';

import { availableTransLanguageList } from './translationCode';

import { 
    toggleSTTTranslation,
    changeSTTTargetLanguage,
    changeSTTTargetTransLanguage,
    changeSubtitleFontSize,
    changeSubtitleVisibility,
    retryRequest
} from '../../actions';

type Props = {
    _conference: Object,

    _sttEnabled: Boolean,

    _isLocalModerator: Boolean,

    _sttOn: Boolean,

    _targetLanguage: String,

    _targetTransLanguage: String,

    _subtitleSize: String,

    t: function,

    dispatch: function,
};

/**
 * Component that renders the stt options dialog.
 *
 * @returns {React$Element<any>}
 */
function STTDialog({
    _sttEnabled,
    _translationEnabled,
    _isLocalModerator,
    _sttOn,
    _targetLanguage,
    _targetTransLanguage,
    _subtitleSize,
    _subtitleVisible,
    _roomInfo,
    _apiBase,
    _shouldRetry,
    t,
    dispatch
}: Props) {
    const [enabled, setEnabled] = useState(_sttEnabled);
    const [targetLanguage, setTargetLanguage] = useState(_targetLanguage || i18next.language);
    const [subtitleVisible, setSubtitleVisible] = useState(_subtitleVisible);
    const [fontSize, setFontSize] = useState(_subtitleSize || 'medium');
    const [translationEnabled, setTranslationEnabled] = useState(_translationEnabled || false);
    const [targetTransLanguage, setTargetTransLanguage] = useState(_targetTransLanguage || i18next.language);

    const onToggleEnable = () => {
        const targetValue = !enabled;
        setEnabled(targetValue);
        const reqConfig = {
            headers: { Authorization: `Bearer ${window._env_.VMEETING_API_TOKEN}`}
        };
        axios.patch(`${_apiBase}/conferences/${_roomInfo._id}`, {
            stt_enabled: targetValue
        }, reqConfig);
    }

    const onChangeTargetLanguage = (e) => {
        const target = e.currentTarget.getAttribute('data-lang');
        setTargetLanguage(target);
        dispatch(changeSTTTargetLanguage(target));
    }

    const onToggleSubtitleVisibility = () => {
        const targetValue = !subtitleVisible;
        setSubtitleVisible(targetValue);
        dispatch(changeSubtitleVisibility(targetValue));
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

    const onChangeTargetTransLanguage = (e) => {
        const target = e.currentTarget.getAttribute('data-translang');
        setTargetTransLanguage(target);
        dispatch(changeSTTTargetTransLanguage(target));
    }

    const onRetry = () => {
        dispatch(retryRequest());
    }

    return (
        <Dialog
            hideCancelButton = { true }
            submitDisabled = { true }
            titleKey = 'stt.header'
            width = { i18next.language === 'ko'? 'small' : 450 }>
            <div className = 'stt-dialog'>
                <div className = 'stt-section'>
                    <p
                        className = 'description'
                        role = 'banner'>
                        { _isLocalModerator? t('stt.featureDesc') : t('stt.featureDescP') }
                    </p>
                    <div className = 'control-row'>
                        <label htmlFor = 'stt-enable-section-switch'>
                            { t('stt.toggleLabel') }
                        </label>
                        <Switch
                            id = 'stt-enable-section-switch'
                            onValueChange = { onToggleEnable }
                            value = { enabled } 
                            disabled={!_isLocalModerator || (_sttEnabled && !_sttOn)}/>
                    </div>
                    { !_isLocalModerator &&
                            <p
                            className = 'description'
                            role = 'banner'>
                            {t('stt.modDesc') }
                            </p>
                    }
                </div>
                {
                    _sttEnabled?
                        _sttOn? 
                        <div className = 'stt-section'>
                            <div className = 'control-row-sub'>
                                <label htmlFor = 'stt-target-language'>
                                    { t('stt.currentTargetLanguage') }
                                </label>
                                <div className = 'stt-dropdown'>
                                    <DropdownMenu
                                        shouldFitContainer = { true }
                                        trigger = {targetLanguage === 'ko'? '한국어' : 'English'}
                                        triggerButtonProps = {{
                                            shouldFitContainer: true,
                                            id: 'stt-dropdown-id',
                                            className: 'stt-dropdown-label'
                                        }}
                                        triggerType = 'button'>
                                        <DropdownItemGroup>
                                            <DropdownItem
                                                data-lang='ko'
                                                key='ko'
                                                isSelected = {'ko' === targetLanguage}
                                                onClick={onChangeTargetLanguage}>
                                                <span className='stt-dropdown-label'>
                                                { t('languages:ko') }
                                                </span>
                                            </DropdownItem>
                                            <DropdownItem
                                                data-lang='en'
                                                key='en'
                                                isSelected = {'en' === targetLanguage}
                                                onClick={onChangeTargetLanguage}>
                                                <span className='stt-dropdown-label'>
                                                { t('languages:en') }
                                                </span>
                                            </DropdownItem>
                                        </DropdownItemGroup>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <div className = 'separator-line' />
                            <div>
                                <div className = 'control-row'>
                                    <label htmlFor = 'stt-subtitle-visibility'>
                                        { t('stt.subtitleVisibility') }
                                    </label>
                                    <Switch
                                        id = 'stt-subtitle-visible-section-switch'
                                        onValueChange = { onToggleSubtitleVisibility }
                                        value = { subtitleVisible }/>
                                </div>
                                <div className= 'description'>
                                    { t('stt.visibilityDesc') }
                                </div>
                            </div>
                            <div>
                                <div className = 'control-row'>
                                    <label htmlFor = 'stt-target-language'>
                                        { t('stt.fontSize') }
                                    </label>
                                    <div className = 'stt-dropdown'>
                                        <DropdownMenu
                                            shouldFitContainer = { true }
                                            trigger = {t(`stt.font_${fontSize}`)}
                                            triggerButtonProps = {{
                                                shouldFitContainer: true,
                                                id: 'stt-fs-dropdown-id',
                                                className: 'stt-dropdown-label'
                                            }}
                                            triggerType = 'button'>
                                            <DropdownItemGroup>
                                                <DropdownItem
                                                    data-fontsize='small'
                                                    key='small'
                                                    isSelected = {'small' === fontSize}
                                                    onClick={onChangeFontSize}>
                                                    <span className='stt-dropdown-label'>
                                                    {t('stt.font_small')}
                                                    </span>
                                                </DropdownItem>
                                                <DropdownItem
                                                    data-fontsize='medium'
                                                    key='medium'
                                                    isSelected = {'medium' === fontSize}
                                                    onClick={onChangeFontSize}>
                                                    <span className='stt-dropdown-label'>
                                                    {t('stt.font_medium')}
                                                    </span>
                                                </DropdownItem>
                                                <DropdownItem
                                                    data-fontsize='large'
                                                    key='large'
                                                    isSelected = {'large' === fontSize}
                                                    onClick={onChangeFontSize}>
                                                    <span className='stt-dropdown-label'>
                                                    {t('stt.font_large')}
                                                    </span>
                                                </DropdownItem>
                                            </DropdownItemGroup>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <div className= 'description'>
                                    { t('stt.fontSizeDesc') }
                                </div>
                            </div>
                            <div className = 'separator-line' />
                            <div>
                                <div className = 'control-row'>
                                    <label htmlFor = 'stt-translation-section-switch'>
                                        { t('stt.toggleTranslation') }
                                    </label>
                                    <Switch
                                        id = 'stt-translation-section-switch'
                                        onValueChange = { onToggleTranslation }
                                        value = { translationEnabled }/>
                                </div>
                                <div className= 'description'>
                                    { t('stt.transDesc') }
                                </div>
                            </div>
                            { translationEnabled &&
                                <div className = 'control-row-sub'>
                                    <label htmlFor = 'stt-target-trans-language'>
                                        { t('stt.currentTransLanguage') }
                                    </label>
                                    <div className = 'stt-dropdown'>
                                        <DropdownMenu
                                            shouldFitContainer = { true }
                                            trigger = { availableTransLanguageList.find(e => e.translationCode === targetTransLanguage)[i18next.language === 'ko'? 'name_ko' : 'name'] }
                                            triggerButtonProps = {{
                                                shouldFitContainer: true,
                                                id: 'stt-dropdown-id',
                                                className: 'stt-dropdown-label'
                                            }}
                                            triggerType = 'button'>
                                            <DropdownItemGroup>
                                                {
                                                    availableTransLanguageList.map(({translationCode, name, name_ko }, idx) => (<DropdownItem
                                                        data-translang={translationCode}
                                                        key={translationCode}
                                                        isSelected = {{translationCode} === targetTransLanguage}
                                                        onClick={onChangeTargetTransLanguage}>
                                                        <span className='stt-dropdown-label'>
                                                        { i18next.language === 'ko'? name_ko : name }
                                                        </span>
                                                        </DropdownItem>
                                                    ))
                                                }
                                            </DropdownItemGroup>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            }
                        </div> :
                        _sttEnabled?
                            (_shouldRetry?
                            <div className = 'stt-retry-button-container'>
                                <div className = 'stt-retry-button' onClick={onRetry}>
                                    <Icon size = { 48 } src = { IconRefresh } />
                                </div>
                                <span className='stt-retry-desp'>
                                    {t('stt.retryDesc1')}
                                </span>
                                <span className='stt-retry-desp'>
                                    {t('stt.retryDesc2')}
                                </span>
                            </div>:
                            <div className = 'stt-spinner'>
                                <Spinner
                                    isCompleting = { false }
                                    size = 'medium' />
                            </div>) : null
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
        _sttEnabled,
        _recorder,
        _targetLanguage,
        _targetTransLanguage,
        _subtitleSize,
        _subtitleVisible,
        _translationEnabled,
        _wsServer,
        _retryCheck
    } = state['features/stt'];
    const isModerator = isLocalParticipantModerator(state);

    const shouldRetry = _sttEnabled && _wsServer && _retryCheck;
    const defaultSize = _subtitleSize? _subtitleSize : state['features/base/config'].stt.subtitleSize;

    return {
        _sttEnabled: _sttEnabled,
        _translationEnabled: _translationEnabled,
        _isLocalModerator: isModerator,
        _sttOn: _recorder? true : false,
        _targetLanguage: _targetLanguage,
        _targetTransLanguage: _targetTransLanguage,
        _subtitleSize: defaultSize,
        _subtitleVisible: _subtitleVisible,
        _roomInfo: state['features/base/conference']?.roomInfo,
        _apiBase: getAuthUrl(state),
        _shouldRetry: shouldRetry
    };
}

export default translate(connect(mapStateToProps)(STTDialog));
