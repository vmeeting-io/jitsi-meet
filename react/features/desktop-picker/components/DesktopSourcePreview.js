import React, { Component } from 'react';

import { translate } from '../../base/i18n/functions';


/**
 * React component for displaying a preview of a DesktopCapturerSource.
 *
 * @augments Component
 */
class DesktopSourcePreview extends Component {
    /**
     * Initializes a new DesktopSourcePreview instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._onClick = this._onClick.bind(this);
        this._onDoubleClick = this._onDoubleClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const selectedClass = this.props.selected ? 'is-selected' : '';
        const displayClasses = `desktop-picker-source ${selectedClass}`;

        return (
            <div
                className = { displayClasses }
                onClick = { this._onClick }
                onDoubleClick = { this._onDoubleClick }>
                {this._renderThumbnailImageContainer()}
                <div className = 'desktop-source-preview-label'>
                    { this.props.source.name }
                </div>
            </div>
        );
    }

    /**
     * Render thumbnail screenshare image.
     *
     * @returns {Object} - Thumbnail image.
     */
    _renderThumbnailImageContainer() {
        // default data URL for thumnbail image
        let srcImage = this.props.source.thumbnail.dataUrl;

        // legacy thumbnail image
        if (typeof this.props.source.thumbnail.toDataURL === 'function') {
            srcImage = this.props.source.thumbnail.toDataURL();
        }

        return (
            <div className = 'desktop-source-preview-image-container'>
                { this._renderThumbnailImage(srcImage) }
            </div>
        );

    }

    /**
     * Render thumbnail screenshare image.
     *
     * @param {string} src - Of the image.
     * @returns {Object} - Thumbnail image.
     */
    _renderThumbnailImage(src) {
        return (
            <img
                alt = { this.props.t('welcomepage.logo.desktopPreviewThumbnail') }
                className = 'desktop-source-preview-thumbnail'
                src = { src } />
        );
    }

    /**
     * Invokes the passed in onClick callback.
     *
     * @returns {void}
     */
    _onClick() {
        const { source, type } = this.props;

        this.props.onClick(source.id, type);
    }

    /**
     * Invokes the passed in onDoubleClick callback.
     *
     * @returns {void}
     */
    _onDoubleClick() {
        const { source, type } = this.props;

        this.props.onDoubleClick(source.id, type);
    }
}

export default translate(DesktopSourcePreview);
