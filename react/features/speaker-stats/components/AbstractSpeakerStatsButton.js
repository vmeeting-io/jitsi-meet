import { IconConnection } from '../../base/icons/svg';
import AbstractButton from '../../base/toolbox/components/AbstractButton';

/**
 * Implementation of a button for opening speaker stats dialog.
 */
class AbstractSpeakerStatsButton extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.speakerStats';
    icon = IconConnection;
    label = 'toolbar.speakerStats';
    tooltip = 'toolbar.speakerStats';
}

export default AbstractSpeakerStatsButton;
