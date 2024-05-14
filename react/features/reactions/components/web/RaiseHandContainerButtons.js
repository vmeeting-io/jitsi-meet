import React from 'react';
import { useSelector } from 'react-redux';

import { isMobileBrowser } from '../../../base/environment/utils';
import { isReactionsButtonEnabled, shouldDisplayReactionsButtons } from '../../functions.web';

import RaiseHandButton from './RaiseHandButton';
import ReactionsMenuButton from './ReactionsMenuButton';

const RaiseHandContainerButton = (props) => {
    const reactionsButtonEnabled = useSelector(isReactionsButtonEnabled);
    const _shouldDisplayReactionsButtons = useSelector(shouldDisplayReactionsButtons);
    const isNarrowLayout = useSelector((state) => state['features/base/responsive-ui'].isNarrowLayout);
    const showReactionsAsPartOfRaiseHand
        = _shouldDisplayReactionsButtons && !reactionsButtonEnabled && !isNarrowLayout && !isMobileBrowser();

    return showReactionsAsPartOfRaiseHand
        ? <ReactionsMenuButton
            { ...props }
            showRaiseHand = { true } />
        : <RaiseHandButton { ...props } />;
};

export default RaiseHandContainerButton;
