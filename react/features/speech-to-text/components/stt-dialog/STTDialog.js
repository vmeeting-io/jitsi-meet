// @flow

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { getAuthUrl } from '../../../../api/url';
import { translate } from '../../../base/i18n/functions';
import i18next from '../../../base/i18n/i18next';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import Icon from '../../../base/icons/components/Icon';
import { IconRefresh } from '../../../base/icons/svg';
import Dialog from '../../../base/ui/components/web/Dialog';
import Select from '../../../base/ui/components/web/Select';
import Spinner from '../../../base/ui/components/web/Spinner';
import Switch from '../../../base/ui/components/web/Switch';

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

const useStyles = makeStyles()(theme => {
    return {
        targetLanguage: {
            width: '100%',
        },

        fontSize: {
            width: '100%',
        }
    };
});

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
    const { classes } = useStyles();
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
            headers: { Authorization: `Bearer ${window._env_.VMEETING_API_TOKEN}` }
        };
        axios.patch(`${_apiBase}/conferences/${_roomInfo._id}`, {
            stt_enabled: targetValue
        }, reqConfig);
    }

    const onChangeTargetLanguage = (e) => {
        const target = e.target.value;
        setTargetLanguage(target);
        dispatch(changeSTTTargetLanguage(target));
    }

    const onToggleSubtitleVisibility = () => {
        const targetValue = !subtitleVisible;
        setSubtitleVisible(targetValue);
        dispatch(changeSubtitleVisibility(targetValue));
    }

    const onChangeFontSize = (e) => {
        const target = e.target.value;
        setFontSize(target);
        dispatch(changeSubtitleFontSize(target));
    }

    const onToggleTranslation = () => {
        const targetValue = !translationEnabled;
        setTranslationEnabled(targetValue);
        dispatch(toggleSTTTranslation(targetValue));
    }

    const onChangeTargetTransLanguage = (e) => {
        const target = e.target.value;
        setTargetTransLanguage(target);
        dispatch(changeSTTTargetTransLanguage(target));
    }

    const onRetry = () => {
        dispatch(retryRequest());
    }

    const languageItems = [
        { value: 'ko', label: t('languages:ko') },
        { value: 'en', label: t('languages:en') }
    ];

    const fontSizeItems = [
        { value: 'small', label: t('stt.font_small') },
        { value: 'medium', label: t('stt.font_medium') },
        { value: 'large', label: t('stt.font_large') }
    ];

    const transLanguageItems = availableTransLanguageList.map(({ translationCode, name, name_ko }) => ({
        value: translationCode,
        label: i18next.language === 'ko' ? name_ko : name
    }));

    return (
        <Dialog
            ok={{ hidden: true }}
            cancel={{ hidden: true }}
            titleKey='stt.header'
            width={i18next.language === 'ko' ? 'small' : 450}>
            <div className='stt-dialog'>
                <div className='stt-section'>
                    <p
                        className='description'
                        role='banner'>
                        {_isLocalModerator ? t('stt.featureDesc') : t('stt.featureDescP')}
                    </p>
                    <div className='control-row'>
                        <label htmlFor='stt-enable-section-switch'>
                            {t('stt.toggleLabel')}
                        </label>
                        <Switch
                            id='stt-enable-section-switch'
                            onChange={onToggleEnable}
                            checked={enabled}
                            disabled={!_isLocalModerator || (_sttEnabled && !_sttOn)} />
                    </div>
                    {!_isLocalModerator &&
                        <p
                            className='description'
                            role='banner'>
                            {t('stt.modDesc')}
                        </p>
                    }
                </div>
                {/*
                {
                    _sttEnabled ?
                        _sttOn ?
                            <div className='stt-section'>
                                <div className='control-row-sub'>
                                    <div className={classes.targetLanguage}>
                                        <Select
                                            label={t('stt.currentTargetLanguage')}
                                            onChange={onChangeTargetLanguage}
                                            options={languageItems}
                                            containerStyle={{ flexDirection: 'row', justifyContent: 'space-between' }}
                                            value={targetLanguage} />
                                    </div>
                                </div>
                                <div className='separator-line' />
                                <div>
                                    <div className='control-row'>
                                        <label htmlFor='stt-subtitle-visibility'>
                                            {t('stt.subtitleVisibility')}
                                        </label>
                                        <Switch
                                            id='stt-subtitle-visible-section-switch'
                                            onValueChange={onToggleSubtitleVisibility}
                                            value={subtitleVisible} />
                                    </div>
                                    <div className='description'>
                                        {t('stt.visibilityDesc')}
                                    </div>
                                </div>
                                <div>
                                    <div className='control-row'>
                                        <div className={classes.fontSize}>
                                            <Select
                                                label={t('stt.fontSize')}
                                                onChange={onChangeFontSize}
                                                options={fontSizeItems}
                                                containerStyle={{ flexDirection: 'row', justifyContent: 'space-between' }}
                                                value={fontSize} />
                                        </div>
                                    </div>
                                    <div className='description'>
                                        {t('stt.fontSizeDesc')}
                                    </div>
                                </div>
                                <div className='separator-line' />
                                <div>
                                    <div className='control-row'>
                                        <label htmlFor='stt-translation-section-switch'>
                                            {t('stt.toggleTranslation')}
                                        </label>
                                        <Switch
                                            id='stt-translation-section-switch'
                                            onValueChange={onToggleTranslation}
                                            value={translationEnabled} />
                                    </div>
                                    <div className='description'>
                                        {t('stt.transDesc')}
                                    </div>
                                </div>
                                {translationEnabled &&
                                    <div className='control-row-sub'>
                                        <div className='stt-trans-language'>
                                            <Select
                                                label={t('stt.currentTransLanguage')}
                                                onChange={onChangeTargetTransLanguage}
                                                options={transLanguageItems}
                                                value={targetTransLanguage} />
                                        </div>
                                    </div>
                                }
                            </div> :
                            _sttEnabled ?
                                (_shouldRetry ?
                                    <div className='stt-retry-button-container'>
                                        <div className='stt-retry-button' onClick={onRetry}>
                                            <Icon size={48} src={IconRefresh} />
                                        </div>
                                        <span className='stt-retry-desp'>
                                            {t('stt.retryDesc1')}
                                        </span>
                                        <span className='stt-retry-desp'>
                                            {t('stt.retryDesc2')}
                                        </span>
                                    </div> :
                                    <div className='stt-spinner'>
                                        <Spinner
                                            isCompleting={false}
                                            size='medium' />
                                    </div>) : null
                        : null
                }
                */}
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
    const defaultSize = _subtitleSize ? _subtitleSize : state['features/base/config'].stt.subtitleSize;

    return {
        _sttEnabled: _sttEnabled,
        _translationEnabled: _translationEnabled,
        _isLocalModerator: isModerator,
        _sttOn: _recorder ? true : false,
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
