import React from 'react';

import { IconDotsHorizontal } from '../../../base/icons/svg';
import Button from '../../../base/ui/components/web/Button';

const ParticipantActionEllipsis = ({ accessibilityLabel, onClick, participantID }) => (
    <Button
        accessibilityLabel = { accessibilityLabel }
        icon = { IconDotsHorizontal }
        onClick = { onClick }
        size = 'small'
        testId = { participantID ? `participant-more-options-${participantID}` : undefined } />
);

export default ParticipantActionEllipsis;
