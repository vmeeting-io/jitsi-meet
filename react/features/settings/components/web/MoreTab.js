import { Theme } from '@mui/material';
import clsx from 'clsx';
import React from 'react';
import { withStyles } from 'tss-react/mui';

import AbstractDialogTab from '../../../base/dialog/components/web/AbstractDialogTab';
import { translate } from '../../../base/i18n/functions';
import Checkbox from '../../../base/ui/components/web/Checkbox';
import Select from '../../../base/ui/components/web/Select';
import { MAX_ACTIVE_PARTICIPANTS } from '../../../filmstrip/constants';

const styles = (theme: Theme) => {
    return {
        container: {
            display: 'flex',
            flexDirection: 'column',
            padding: '0 2px'
        },

        divider: {
            margin: `${theme.spacing(4)} 0`,
            width: '100%',
            height: '1px',
            border: 0,
            backgroundColor: theme.palette.ui03
        },

        checkbox: {
            margin: `${theme.spacing(3)} 0`
        }
    };
};

/**
 * React {@code Component} for modifying language and moderator settings.
 *
 * @augments Component
 */
class MoreTab extends AbstractDialogTab {
    /**
     * Initializes a new {@code MoreTab} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onShowPrejoinPageChanged = this._onShowPrejoinPageChanged.bind(this);
        this._renderMaxStageParticipantsSelect = this._renderMaxStageParticipantsSelect.bind(this);
        this._onMaxStageParticipantsSelect = this._onMaxStageParticipantsSelect.bind(this);
        this._onHideSelfViewChanged = this._onHideSelfViewChanged.bind(this);
        this._onLanguageItemSelect = this._onLanguageItemSelect.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            showPrejoinSettings,
            disableHideSelfView,
            iAmVisitor,
            hideSelfView,
            showLanguageSettings,
            t
        } = this.props;
        const classes = withStyles.getClasses(this.props);

        return (
            <div
                className = { clsx('more-tab', classes.container) }
                key = 'more'>
                {showPrejoinSettings && <>
                    {this._renderPrejoinScreenSettings()}
                    <hr className = { classes.divider } />
                </>}
                {this._renderMaxStageParticipantsSelect()}
                {!disableHideSelfView && !iAmVisitor && (
                    <Checkbox
                        checked = { hideSelfView }
                        className = { classes.checkbox }
                        label = { t('videothumbnail.hideSelfView') }
                        name = 'hide-self-view'
                        onChange = { this._onHideSelfViewChanged } />
                )}
                {showLanguageSettings && this._renderLanguageSelect()}
            </div>
        );
    }

    /**
     * Callback invoked to select if the lobby
     * should be shown.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onShowPrejoinPageChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({ showPrejoinPage: checked });
    }

    /**
     * Callback invoked to select a max number of stage participants from the select dropdown.
     *
     * @param {Object} e - The key event to handle.
     * @private
     * @returns {void}
     */
    _onMaxStageParticipantsSelect(e: React.ChangeEvent<HTMLSelectElement>) {
        const maxParticipants = Number(e.target.value);

        super._onChange({ maxStageParticipants: maxParticipants });
    }

    /**
     * Callback invoked to select if hide self view should be enabled.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onHideSelfViewChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({ hideSelfView: checked });
    }

    /**
     * Callback invoked to select a language from select dropdown.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onLanguageItemSelect(e: React.ChangeEvent<HTMLSelectElement>) {
        const language = e.target.value;

        super._onChange({ currentLanguage: language });
    }

    /**
     * Returns the React Element for modifying prejoin screen settings.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderPrejoinScreenSettings() {
        const { t, showPrejoinPage } = this.props;

        return (
            <Checkbox
                checked = { showPrejoinPage }
                label = { t('prejoin.showScreen') }
                name = 'show-prejoin-page'
                onChange = { this._onShowPrejoinPageChanged } />
        );
    }

    /**
     * Returns the React Element for the max stage participants dropdown.
     *
     * @returns {ReactElement}
     */
    _renderMaxStageParticipantsSelect() {
        const { maxStageParticipants, t, stageFilmstripEnabled } = this.props;

        if (!stageFilmstripEnabled) {
            return null;
        }
        const maxParticipantsItems = Array(MAX_ACTIVE_PARTICIPANTS).fill(0)
            .map((no, index) => {
                return {
                    value: index + 1,
                    label: `${index + 1}`
                };
            });

        return (
            <Select
                id = 'more-maxStageParticipants-select'
                label = { t('settings.maxStageParticipants') }
                onChange = { this._onMaxStageParticipantsSelect }
                options = { maxParticipantsItems }
                value = { maxStageParticipants } />
        );
    }

    /**
     * Returns the menu item for changing displayed language.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderLanguageSelect() {
        const {
            currentLanguage,
            languages,
            t
        } = this.props;

        const languageItems
            = languages.map((language: string) => {
                return {
                    value: language,
                    label: t(`languages:${language}`)
                };
            });

        return (
            <Select
                id = 'more-language-select'
                label = { t('settings.language') }
                onChange = { this._onLanguageItemSelect }
                options = { languageItems }
                value = { currentLanguage } />
        );
    }
}

export default withStyles(translate(MoreTab), styles);
