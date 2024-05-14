import React, { Component } from 'react';
import { connect } from 'react-redux';

import { isVpaasMeeting } from '../../../../jaas/functions';
import { translate } from '../../../i18n/functions';

/**
 * The CSS style of the element with CSS class {@code rightwatermark}.
 *
 * @private
 */
const _RIGHT_WATERMARK_STYLE = {
    backgroundImage: 'url(images/rightwatermark.png)'
};

/**
 * A Web Component which renders watermarks such as Jits, brand, powered by,
 * etc.
 */
class Watermarks extends Component {
    /**
     * Initializes a new Watermarks instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        const showBrandWatermark = interfaceConfig.SHOW_BRAND_WATERMARK;

        this.state = {
            brandWatermarkLink:
                showBrandWatermark ? interfaceConfig.BRAND_WATERMARK_LINK : '',
            showBrandWatermark,
            showPoweredBy: interfaceConfig.SHOW_POWERED_BY
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div className={this.props.className ?? ''}>
                {
                    this._renderJitsiWatermark()
                }
                {
                    this._renderBrandWatermark()
                }
                {
                    this._renderPoweredBy()
                }
            </div>
        );
    }

    /**
     * Renders a brand watermark if it is enabled.
     *
     * @private
     * @returns {ReactElement|null} Watermark element or null.
     */
    _renderBrandWatermark() {
        let reactElement = null;

        if (this.state.showBrandWatermark) {
            reactElement = (
                <div
                    className = 'watermark rightwatermark'
                    style = { _RIGHT_WATERMARK_STYLE } />
            );

            const { brandWatermarkLink } = this.state;

            if (brandWatermarkLink) {
                reactElement = (
                    <a
                        href = { brandWatermarkLink }
                        target = '_new'>
                        { reactElement }
                    </a>
                );
            }
        }

        return reactElement;
    }

    /**
     * Renders a Jitsi watermark if it is enabled.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderJitsiWatermark() {
        const {
            _logoLink,
            _logoUrl,
            _showJitsiWatermark
        } = this.props;
        const { noMargins, t } = this.props;
        const className = `watermark leftwatermark ${noMargins ? 'no-margin' : ''}`;

        let reactElement = null;

        if (_showJitsiWatermark) {

            reactElement = (<img
                className = {`watermark leftwatermark ${!_logoLink ? className : ''}`}
                src = { _logoUrl } />);

            if (_logoLink) {
                reactElement = (
                    <a
                        aria-label = { t('jitsiHome', { logo: interfaceConfig.APP_NAME }) }
                        className = { className }
                        href = { _logoLink }
                        target = '_new'>
                        { reactElement }
                    </a>
                );
            }
        }

        return reactElement;
    }

    /**
     * Renders a powered by block if it is enabled.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderPoweredBy() {
        if (this.state.showPoweredBy) {
            const { t } = this.props;

            return (
                <a
                    className = 'poweredby'
                    href = 'http://jitsi.org'
                    target = '_new'>
                    <span>{ t('poweredby') } jitsi.org</span>
                </a>
            );
        }

        return null;
    }
}

/**
 * Maps parts of Redux store to component prop types.
 *
 * @param {Object} state - Snapshot of Redux store.
 * @param {Object} ownProps - Component's own props.
 * @returns {IProps}
 */
function _mapStateToProps(state, ownProps) {
    const {
        customizationReady,
        customizationFailed,
        defaultBranding,
        useDynamicBrandingData,
        logoClickUrl,
        logoImageUrl
    } = state['features/dynamic-branding'];
    const isValidRoom = state['features/base/conference'].room;
    const { defaultLogoUrl } = state['features/base/config'];
    const {
        JITSI_WATERMARK_LINK,
        SHOW_JITSI_WATERMARK
    } = interfaceConfig;
    let _showJitsiWatermark = (
        customizationReady && !customizationFailed
        && SHOW_JITSI_WATERMARK)
    || !isValidRoom;
    let _logoUrl: string | undefined = logoImageUrl;
    let _logoLink = logoClickUrl;

    if (useDynamicBrandingData) {
        if (isVpaasMeeting(state)) {
            // don't show logo if request fails or no logo set for vpaas meetings
            _showJitsiWatermark = !customizationFailed && Boolean(logoImageUrl);
        } else if (defaultBranding) {
            _logoUrl = defaultLogoUrl;
            _logoLink = JITSI_WATERMARK_LINK;
        }
    } else {
        // When there is no custom branding data use defaults
        _logoUrl = ownProps.defaultJitsiLogoURL || defaultLogoUrl;
        _logoLink = JITSI_WATERMARK_LINK;
    }

    return {
        _logoLink,
        _logoUrl,
        _showJitsiWatermark
    };
}

export default translate(connect(_mapStateToProps)(Watermarks));
