// @flow

import React, { useState } from 'react';
import type { AbstractComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { isEnabled } from '../../av-moderation/functions';
import { isLocalParticipantModerator } from '../../base/participants';

/*
 * Props that will be passed by the AbstractPollsPane to its
 * concrete implementations (web/native).
 **/
export type AbstractProps = {
    createMode: boolean,
    onCreate: void => void,
    setCreateMode: boolean => void,
    t: Function,
};

/**
 * Higher Order Component taking in a concrete PollsPane component and
 * augmenting it with state/behavior common to both web and native implementations.
 *
 * @param {React.AbstractComponent} Component - The concrete component.
 * @returns {React.AbstractComponent}
 */
const AbstractPollsPane = (Component: AbstractComponent<AbstractProps>) => () => {

    const [ createMode, setCreateMode ] = useState(false);
    const pollModerationEnabled = useSelector(isEnabled('poll'));
    const isModerator = useSelector(isLocalParticipantModerator);

    const onCreate = () => {
        setCreateMode(true);
    };

    const { t } = useTranslation();

    return (<Component
        createMode = { createMode }
        isModerationEnabled = { pollModerationEnabled && !isModerator }
        /* eslint-disable react/jsx-no-bind */
        onCreate = { onCreate }
        setCreateMode = { setCreateMode }
        t = { t } />);

};

export default AbstractPollsPane;
