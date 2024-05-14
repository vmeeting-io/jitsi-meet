import React from 'react';
import { withStyles } from 'tss-react/mui';

import AbstractDialogTab from '../../../base/dialog/components/web/AbstractDialogTab';
import { translate } from '../../../base/i18n/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Checkbox from '../../../base/ui/components/web/Checkbox';

const styles = (theme) => {
    return {
        container: {
            display: 'flex',
            flexDirection: 'column'
        },

        title: {
            ...withPixelLineHeight(theme.typography.heading6),
            color: `${theme.palette.text01} !important`,
            marginBottom: theme.spacing(3)
        },

        checkbox: {
            marginBottom: theme.spacing(3)
        }
    };
};

/**
 * React {@code Component} for modifying language and moderator settings.
 *
 * @augments Component
 */
class ModeratorTab extends AbstractDialogTab {
    /**
     * Initializes a new {@code ModeratorTab} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onStartAudioMutedChanged = this._onStartAudioMutedChanged.bind(this);
        this._onStartVideoMutedChanged = this._onStartVideoMutedChanged.bind(this);
        this._onStartReactionsMutedChanged = this._onStartReactionsMutedChanged.bind(this);
        this._onFollowMeEnabledChanged = this._onFollowMeEnabledChanged.bind(this);
    }

    /**
     * Callback invoked to select if conferences should start
     * with audio muted.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onStartAudioMutedChanged({ target: { checked } }) {
        super._onChange({ startAudioMuted: checked });
    }

    /**
     * Callback invoked to select if conferences should start
     * with video disabled.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onStartVideoMutedChanged({ target: { checked } }) {
        super._onChange({ startVideoMuted: checked });
    }

    /**
     * Callback invoked to select if conferences should start
     * with reactions muted.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onStartReactionsMutedChanged({ target: { checked } }) {
        super._onChange({ startReactionsMuted: checked });
    }

    /**
     * Callback invoked to select if follow-me mode
     * should be activated.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onFollowMeEnabledChanged({ target: { checked } }) {
        super._onChange({ followMeEnabled: checked });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            disableReactionsModeration,
            followMeActive,
            followMeEnabled,
            startAudioMuted,
            startVideoMuted,
            startReactionsMuted,
            t
        } = this.props;
        const classes = withStyles.getClasses(this.props);

        return (
            <div
                className = { `moderator-tab ${classes.container}` }
                key = 'moderator'>
                <h2 className = { classes.title }>
                    {t('settings.moderatorOptions')}
                </h2>
                <Checkbox
                    checked = { startAudioMuted }
                    className = { classes.checkbox }
                    label = { t('settings.startAudioMuted') }
                    name = 'start-audio-muted'
                    onChange = { this._onStartAudioMutedChanged } />
                <Checkbox
                    checked = { startVideoMuted }
                    className = { classes.checkbox }
                    label = { t('settings.startVideoMuted') }
                    name = 'start-video-muted'
                    onChange = { this._onStartVideoMutedChanged } />
                <Checkbox
                    checked = { followMeEnabled && !followMeActive }
                    className = { classes.checkbox }
                    disabled = { followMeActive }
                    label = { t('settings.followMe') }
                    name = 'follow-me'
                    onChange = { this._onFollowMeEnabledChanged } />
                { !disableReactionsModeration
                        && <Checkbox
                            checked = { startReactionsMuted }
                            className = { classes.checkbox }
                            label = { t('settings.startReactionsMuted') }
                            name = 'start-reactions-muted'
                            onChange = { this._onStartReactionsMutedChanged } /> }
            </div>
        );
    }
}

export default withStyles(translate(ModeratorTab), styles);
