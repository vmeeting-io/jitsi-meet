import { translate } from '../../base/i18n/functions';
import ExpandedLabel from '../../base/label/components/native/ExpandedLabel';

import { AUD_LABEL_COLOR } from './styles';

/**
 * A react {@code Component} that implements an expanded label as tooltip-like
 * component to explain the meaning of the {@code VideoQualityLabel}.
 */
class VideoQualityExpandedLabel extends ExpandedLabel {
    /**
     * Returns the color this expanded label should be rendered with.
     *
     * @returns {string}
     */
    _getColor() {
        return AUD_LABEL_COLOR;
    }

    /**
     * Returns the label specific text of this {@code ExpandedLabel}.
     *
     * @returns {string}
     */
    _getLabel() {
        return this.props.t('videoStatus.audioOnlyExpanded');
    }
}

export default translate(VideoQualityExpandedLabel);
