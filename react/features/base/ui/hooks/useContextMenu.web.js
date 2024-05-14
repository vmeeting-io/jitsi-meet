import { useCallback, useRef, useState } from 'react';

import { findAncestorByClass } from '../functions.web';


const initialState = Object.freeze({});

const useContextMenu = () => {
    const [ raiseContext, setRaiseContext ] = useState(initialState);
    const isMouseOverMenu = useRef(false);

    const lowerMenu = useCallback((force: boolean | Object = false) => {
        /**
         * We are tracking mouse movement over the active participant item and
         * the context menu. Due to the order of enter/leave events, we need to
         * defer checking if the mouse is over the context menu with
         * queueMicrotask.
         */
        window.queueMicrotask(() => {
            if (isMouseOverMenu.current && !(force === true)) {
                return;
            }

            if (raiseContext !== initialState) {
                setRaiseContext(initialState);
            }
        });
    }, [ raiseContext ]);

    const raiseMenu = useCallback((entity, target) => {
        setRaiseContext({
            entity,
            offsetTarget: findAncestorByClass(target, 'list-item-container')
        });
    }, [ raiseContext ]);

    const toggleMenu = useCallback((entity) => (e) => {
        e?.stopPropagation();
        const { entity: raisedEntity } = raiseContext;

        if (raisedEntity && raisedEntity === entity) {
            lowerMenu();
        } else {
            raiseMenu(entity, e?.target);
        }
    }, [ raiseContext ]);

    const menuEnter = useCallback(() => {
        isMouseOverMenu.current = true;
    }, []);

    const menuLeave = useCallback(() => {
        isMouseOverMenu.current = false;
    }, [ lowerMenu ]);

    return [ lowerMenu, raiseMenu, toggleMenu, menuEnter, menuLeave, raiseContext ];
};

export default useContextMenu;
