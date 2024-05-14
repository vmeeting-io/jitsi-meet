import React, { useEffect, useState } from 'react';

export const DialogTransitionContext = React.createContext({ isUnmounting: false });

const DialogTransition = ({ children }) => {
    const [ childrenToRender, setChildrenToRender ] = useState(children);
    const [ isUnmounting, setIsUnmounting ] = useState(false);
    const [ timeoutID, setTimeoutID ] = useState(undefined);

    useEffect(() => {
        if (children === null) {
            setIsUnmounting(true);
            if (typeof timeoutID === 'undefined') {
                setTimeoutID(setTimeout(() => {
                    setChildrenToRender(children);
                    setIsUnmounting(false);
                    setTimeoutID(undefined);
                }, 150));
            }
        } else {
            if (typeof timeoutID !== 'undefined') {
                clearTimeout(timeoutID);
                setTimeoutID(undefined);
                setIsUnmounting(false);
            }
            setChildrenToRender(children);
        }
    }, [ children ]);

    return (
        <DialogTransitionContext.Provider value = {{ isUnmounting }}>
            {childrenToRender}
        </DialogTransitionContext.Provider>
    );
};

export default DialogTransition;
