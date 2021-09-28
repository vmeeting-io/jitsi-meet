// @flow

import React from 'react';

import { Icon, IconBirthdayCake } from '../../../base/icons';

import { BirthdayIndicatorBackground } from './styled';

export const BirthdayIndicator = () => (
    <BirthdayIndicatorBackground>
        <Icon
            size = { 15 }
            src = { IconBirthdayCake } />
    </BirthdayIndicatorBackground>
);
