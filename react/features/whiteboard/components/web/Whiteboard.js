import { ExcalidrawApp } from '@jitsi/excalidraw';
import clsx from 'clsx';
import i18next from 'i18next';
import React, { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

// @ts-expect-error
import Filmstrip from '../../../../../modules/UI/videolayout/Filmstrip';
import { translate } from '../../../base/i18n/functions';
import { getLocalParticipant } from '../../../base/participants/functions';
import { getVerticalViewMaxWidth } from '../../../filmstrip/functions.web';
import { getToolboxHeight } from '../../../toolbox/functions.web';
import { shouldDisplayTileView } from '../../../video-layout/functions.any';
import { WHITEBOARD_UI_OPTIONS } from '../../constants';
import {
    getCollabDetails,
    getCollabServerUrl,
    isWhiteboardOpen,
    isWhiteboardVisible
} from '../../functions';

/**
 * Space taken by meeting elements like the subject and the watermark.
 */
const HEIGHT_OFFSET = 80;

/**
 * The Whiteboard component.
 *
 * @param {Props} props - The React props passed to this component.
 * @returns {JSX.Element} - The React component.
 */
const Whiteboard = (props) => {
    const excalidrawRef = useRef(null);
    const excalidrawAPIRef = useRef(null);
    const collabAPIRef = useRef(null);

    const isOpen = useSelector(isWhiteboardOpen);
    const isVisible = useSelector(isWhiteboardVisible);
    const isInTileView = useSelector(shouldDisplayTileView);
    const { clientHeight, clientWidth } = useSelector((state) => state['features/base/responsive-ui']);
    const { visible: filmstripVisible, isResizing } = useSelector((state) => state['features/filmstrip']);
    const filmstripWidth = useSelector(getVerticalViewMaxWidth);
    const collabDetails = useSelector(getCollabDetails);
    const collabServerUrl = useSelector(getCollabServerUrl);
    const { defaultRemoteDisplayName } = useSelector((state) => state['features/base/config']);
    const localParticipantName = useSelector(getLocalParticipant)?.name || defaultRemoteDisplayName || 'Fellow Jitster';

    useEffect(() => {
        if (!collabAPIRef.current) {
            return;
        }

        collabAPIRef.current.setUsername(localParticipantName);
    }, [ localParticipantName ]);

    /**
    * Computes the width and the height of the component.
    *
    * @returns {IDimensions} - The dimensions of the component.
    */
    const getDimensions = () => {
        let width;
        let height;

        if (interfaceConfig.VERTICAL_FILMSTRIP) {
            if (filmstripVisible) {
                width = clientWidth - filmstripWidth;
            } else {
                width = clientWidth;
            }
            height = clientHeight - getToolboxHeight();
        } else {
            if (filmstripVisible) {
                height = clientHeight - Filmstrip.getFilmstripHeight();
            } else {
                height = clientHeight;
            }
            width = clientWidth;
        }

        return {
            width: `${width}px`,
            height: `${height - HEIGHT_OFFSET}px`
        };
    };

    const getExcalidrawAPI = useCallback(excalidrawAPI => {
        if (excalidrawAPIRef.current) {
            return;
        }
        excalidrawAPIRef.current = excalidrawAPI;
    }, []);

    const getCollabAPI = useCallback(collabAPI => {
        if (collabAPIRef.current) {
            return;
        }
        collabAPIRef.current = collabAPI;
        collabAPIRef.current.setUsername(localParticipantName);
    }, [ localParticipantName ]);

    return (
        <div
            className = { clsx(
                isResizing && 'disable-pointer',
                'whiteboard-container'
            ) }
            style = {{
                ...getDimensions(),
                marginTop: `${HEIGHT_OFFSET}px`,
                display: `${isInTileView || !isVisible ? 'none' : 'block'}`
            }}>
            {
                isOpen && (
                    <div className = 'excalidraw-wrapper'>
                        {/*
                          * Excalidraw renders a few lvl 2 headings. This is
                          * quite fortunate, because we actually use lvl 1
                          * headings to mark the big sections of our app. So make
                          * sure to mark the Excalidraw context with a lvl 1
                          * heading before showing the whiteboard.
                          */
                            <span
                                aria-level = { 1 }
                                className = 'sr-only'
                                role = 'heading'>
                                { props.t('whiteboard.accessibilityLabel.heading') }
                            </span>
                        }
                        <ExcalidrawApp
                            collabDetails = { collabDetails }
                            collabServerUrl = { collabServerUrl }
                            excalidraw = {{
                                isCollaborating: true,
                                langCode: i18next.language,

                                // @ts-ignore
                                ref: excalidrawRef,
                                theme: 'light',
                                UIOptions: WHITEBOARD_UI_OPTIONS
                            }}
                            getCollabAPI = { getCollabAPI }
                            getExcalidrawAPI = { getExcalidrawAPI } />
                    </div>
                )
            }
        </div>
    );
};

export default translate(Whiteboard);
