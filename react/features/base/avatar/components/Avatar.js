import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import { IconUser } from '../../icons/svg';
import { getParticipantById } from '../../participants/functions';
import { getAvatarColor, getInitials, isCORSAvatarURL } from '../functions';

import { StatelessAvatar } from './';

export const DEFAULT_SIZE = 65;

/**
 * Implements a class to render avatars in the app.
 */
class Avatar extends PureComponent {
    /**
     * Default values for {@code Avatar} component's properties.
     *
     * @static
     */
    static defaultProps = {
        dynamicColor: true
    };

    /**
     * Instantiates a new {@code Component}.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        const {
            _corsAvatarURLs,
            url,
            useCORS
        } = props;

        this.state = {
            avatarFailed: false,
            isUsingCORS: Boolean(useCORS) || Boolean(url && isCORSAvatarURL(url, _corsAvatarURLs))
        };

        this._onAvatarLoadError = this._onAvatarLoadError.bind(this);
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps) {
        const { _corsAvatarURLs, url } = this.props;

        if (prevProps.url !== url) {

            // URI changed, so we need to try to fetch it again.
            // Eslint doesn't like this statement, but based on the React doc, it's safe if it's
            // wrapped in a condition: https://reactjs.org/docs/react-component.html#componentdidupdate

            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({
                avatarFailed: false,
                isUsingCORS: Boolean(this.props.useCORS) || Boolean(url && isCORSAvatarURL(url, _corsAvatarURLs))
            });
        }
    }

    /**
     * Implements {@code Componenr#render}.
     *
     * @inheritdoc
     */
    render() {
        const {
            _customAvatarBackgrounds,
            _initialsBase,
            _loadableAvatarUrl,
            _loadableAvatarUrlUseCORS,
            className,
            colorBase,
            dynamicColor,
            id,
            size,
            status,
            testId,
            url
        } = this.props;
        const { avatarFailed, isUsingCORS } = this.state;

        const avatarProps = {
            className,
            color: undefined,
            id,
            initials: undefined,
            onAvatarLoadError: undefined,
            onAvatarLoadErrorParams: undefined,
            size,
            status,
            testId,
            url: undefined,
            useCORS: isUsingCORS
        };

        // _loadableAvatarUrl is validated that it can be loaded, but uri (if present) is not, so
        // we still need to do a check for that. And an explicitly provided URI is higher priority than
        // an avatar URL anyhow.
        const useReduxLoadableAvatarURL = avatarFailed || !url;
        const effectiveURL = useReduxLoadableAvatarURL ? _loadableAvatarUrl : url;

        if (effectiveURL) {
            avatarProps.onAvatarLoadError = this._onAvatarLoadError;
            if (useReduxLoadableAvatarURL) {
                avatarProps.onAvatarLoadErrorParams = { dontRetry: true };
                avatarProps.useCORS = _loadableAvatarUrlUseCORS;
            }
            avatarProps.url = effectiveURL;
        }

        const initials = getInitials(_initialsBase);

        if (initials) {
            if (dynamicColor) {
                avatarProps.color = getAvatarColor(colorBase || _initialsBase, _customAvatarBackgrounds ?? []);
            }

            avatarProps.initials = initials;
        }

        if (navigator.product !== 'ReactNative') {
            avatarProps.iconUser = IconUser;
        }

        return (
            <StatelessAvatar
                { ...avatarProps } />
        );
    }

    /**
     * Callback to handle the error while loading of the avatar URI.
     *
     * @param {Object} params - An object with parameters.
     * @param {boolean} params.dontRetry - If false we will retry to load the Avatar with different CORS mode.
     * @returns {void}
     */
    _onAvatarLoadError(params = {}) {
        const { dontRetry = false } = params;

        if (Boolean(this.props.useCORS) === this.state.isUsingCORS && !dontRetry) {
            // try different mode of loading the avatar.
            this.setState({
                isUsingCORS: !this.state.isUsingCORS
            });
        } else {
            // we already have tried loading the avatar with and without CORS and it failed.
            this.setState({
                avatarFailed: true
            });
        }
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {IProps} ownProps - The own props of the component.
 * @returns {IProps}
 */
export function _mapStateToProps(state, ownProps) {
    const { colorBase, displayName, participantId } = ownProps;
    const _participant = participantId ? getParticipantById(state, participantId) : undefined;
    const _initialsBase = _participant?.name ?? displayName;
    const { corsAvatarURLs } = state['features/base/config'];

    return {
        _customAvatarBackgrounds: state['features/dynamic-branding'].avatarBackgrounds,
        _corsAvatarURLs: corsAvatarURLs,
        _initialsBase,
        _loadableAvatarUrl: _participant?.loadableAvatarUrl,
        _loadableAvatarUrlUseCORS: _participant?.loadableAvatarUrlUseCORS,
        colorBase
    };
}

export default connect(_mapStateToProps)(Avatar);
