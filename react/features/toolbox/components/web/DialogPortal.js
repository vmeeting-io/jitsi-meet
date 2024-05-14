import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';

import { ZINDEX_DIALOG_PORTAL } from '../../constants';

/**
 * Component meant to render a drawer at the bottom of the screen,
 * by creating a portal containing the component's children.
 *
 * @returns {ReactElement}
 */
function DialogPortal({ children, className, style, getRef, setSize, targetSelector, onVisible }) {
    const clientWidth = useSelector((state) => state['features/base/responsive-ui'].clientWidth);
    const [ portalTarget ] = useState(() => {
        const portalDiv = document.createElement('div');

        portalDiv.style.visibility = 'hidden';

        return portalDiv;
    });
    const timerRef = useRef();

    useEffect(() => {
        if (style) {
            for (const styleProp of Object.keys(style)) {
                const objStyle = portalTarget.style;

                objStyle[styleProp] = style[styleProp];
            }
        }
        if (className) {
            portalTarget.className = className;
        }
    }, [ style, className ]);

    useEffect(() => {
        if (portalTarget && getRef) {
            getRef(portalTarget);
            portalTarget.style.zIndex = `${ZINDEX_DIALOG_PORTAL}`;
        }
    }, [ portalTarget, getRef ]);

    useEffect(() => {
        const size = {
            width: 1,
            height: 1
        };
        const observer = new ResizeObserver(entries => {
            const { contentRect } = entries[0];

            if (contentRect.width !== size.width || contentRect.height !== size.height) {
                setSize?.(contentRect);
                clearTimeout(timerRef.current);
                timerRef.current = window.setTimeout(() => {
                    portalTarget.style.visibility = 'visible';
                    onVisible?.();
                }, 100);
            }
        });

        const target = targetSelector ? portalTarget.querySelector(targetSelector) : portalTarget;

        if (document.body) {
            document.body.appendChild(portalTarget);
            observer.observe(target ?? portalTarget);
        }

        return () => {
            observer.unobserve(target ?? portalTarget);
            if (document.body) {
                document.body.removeChild(portalTarget);
            }
        };
    }, [ clientWidth ]);

    return ReactDOM.createPortal(
        children,
        portalTarget
    );
}

export default DialogPortal;
