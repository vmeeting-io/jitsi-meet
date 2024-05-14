/* global $, APP, interfaceConfig */

import { DEFAULT_FILMSTRIP_WIDTH } from '../../../react/features/filmstrip/constants';
import { setWhiteboardState } from '../../../react/features/whiteboard/actions';
import { getWhiteboardUrl } from '../../../react/features/whiteboard/functions';

import Filmstrip from '../videolayout/Filmstrip';
import LargeContainer from '../videolayout/LargeContainer';
import VideoLayout from '../videolayout/VideoLayout';

/**
 *
 */
function bubbleIframeMouseMove(iframe) {
    const existingOnMouseMove = iframe.contentWindow.onmousemove;

    iframe.contentWindow.onmousemove = function(e) {
        if (existingOnMouseMove) {
            existingOnMouseMove(e);
        }
        const evt = document.createEvent('MouseEvents');
        const boundingClientRect = iframe.getBoundingClientRect();

        evt.initMouseEvent(
            'mousemove',
            true, // bubbles
            false, // not cancelable
            window,
            e.detail,
            e.screenX,
            e.screenY,
            e.clientX + boundingClientRect.left,
            e.clientY + boundingClientRect.top,
            e.ctrlKey,
            e.altKey,
            e.shiftKey,
            e.metaKey,
            e.button,
            null // no related element
        );
        iframe.dispatchEvent(evt);
    };
}

/**
 * Default Whiteboard frame width.
 */
const DEFAULT_WIDTH = 640;

/**
 * Default Whiteboard frame height.
 */
const DEFAULT_HEIGHT = 480;

export const WHITEBOARD_CONTAINER_TYPE = 'whiteboard';

/**
 * Container for Whiteboard iframe.
 */
class Whiteboard extends LargeContainer {
    /**
     * Creates new Whiteboard object
     */
    constructor(url) {
        super();

        const iframe = document.createElement('iframe');

        iframe.id = 'whiteboardIFrame';
        iframe.src = url;
        iframe.frameBorder = 0;
        iframe.scrolling = 'no';
        iframe.width = DEFAULT_WIDTH;
        iframe.height = DEFAULT_HEIGHT;
        iframe.setAttribute('style', 'visibility: hidden;');

        this.container.appendChild(iframe);

        iframe.onload = function() {
            // eslint-disable-next-line no-self-assign
            document.domain = document.domain;
            bubbleIframeMouseMove(iframe);

            setTimeout(() => {
                const doc = iframe.contentDocument;

                // the iframes inside of the whiteboard are
                // not yet loaded when the whiteboard iframe is loaded
                const outer = doc.getElementsByName('ace_outer')[0];

                // bubbleIframeMouseMove(outer);

                const inner = doc.getElementsByName('ace_inner')[0];

                // bubbleIframeMouseMove(inner);
            }, 2000);
        };

        this.iframe = iframe;
    }

    /**
     *
     */
    get isOpen() {
        return Boolean(this.iframe);
    }

    /**
     *
     */
    get container() {
        return document.getElementById('whiteboard');
    }

    /**
     *
     */
    resize(containerWidth, containerHeight, animate = false) {
        const state = APP.store.getState();
        const verticalFilmstripWidth = state['features/filmstrip'].width?.current;

        let height, width;

        if (interfaceConfig.VERTICAL_FILMSTRIP) {
            height = containerHeight;
            width = containerWidth - (verticalFilmstripWidth ? 0 : Filmstrip.getVerticalFilmstripWidth());
        } else {
            height = containerHeight - Filmstrip.getFilmstripHeight();
            width = containerWidth;
        }

        $(this.iframe)
            .width(width)
            .height(height);
    }

    /**
     *
     */
    show() {
        const $iframe = $(this.iframe);
        const $container = $(this.container);
        const self = this;

        return new Promise(resolve => {
            $iframe.fadeIn(300, () => {
                self.bodyBackground = document.body.style.background;
                document.body.style.background = '#eeeeee';
                $iframe.css({ visibility: 'visible' });
                $container.css({ zIndex: 2 });

                APP.store.dispatch(setWhiteboardState(true));

                resolve();
            });
        });
    }

    /**
     *
     */
    hide() {
        const $iframe = $(this.iframe);
        const $container = $(this.container);

        document.body.style.background = this.bodyBackground;

        return new Promise(resolve => {
            $iframe.fadeOut(300, () => {
                $iframe.css({ visibility: 'hidden' });
                $container.css({ zIndex: 0 });

                APP.store.dispatch(setWhiteboardState(false));

                resolve();
            });
        });
    }

    /**
     * @return {boolean} do not switch on dominant speaker event if on stage.
     */
    stayOnStage() {
        return true;
    }
}

/**
 * Manager of the Whiteboard frame.
 */
export default class WhiteboardManager {
    /**
     *
     */
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.whiteboard = null;
    }

    /**
     *
     */
    get isOpen() {
        return Boolean(this.whiteboard);
    }

    /**
     *
     */
    isVisible() {
        return VideoLayout.isLargeContainerTypeVisible(WHITEBOARD_CONTAINER_TYPE);
    }

    /**
     * Create new Whiteboard frame.
     */
    openWhiteboard() {
        this.whiteboard = new Whiteboard(getWhiteboardUrl(APP.store.getState));
        VideoLayout.addLargeVideoContainer(
            WHITEBOARD_CONTAINER_TYPE,
            this.whiteboard
        );
    }

    /**
     * Toggle Whiteboard frame visibility.
     * Open new Whiteboard frame if there is no Whiteboard frame yet.
     */
    toggleWhiteboard() {
        const isVisible = this.isOpen;
        if (!isVisible) {
            this.openWhiteboard();
        }

        VideoLayout.showLargeVideoContainer(WHITEBOARD_CONTAINER_TYPE, !isVisible);

        if (isVisible) {
            // VideoLayout.showLargeVideoContainer(VIDEO_CONTAINER_TYPE, true);
            VideoLayout.removeLargeVideoContainer(WHITEBOARD_CONTAINER_TYPE);
            this.whiteboard.container.removeChild(this.whiteboard.iframe);
            this.whiteboard = null;
        }
        // console.log('toggleWhiteboard:', isVisible, this.whiteboard);
        APP.store.dispatch(setWhiteboardState(!isVisible));
    }

    reload() {
        //not using getSharedDocumentUrl because redux state is not updated yet at the time this function is calling
        const state = APP.store.getState();
        if (this.whiteboard) {
            this.whiteboard.iframe.src = `${getWhiteboardUrl(state)}`;
        }
    }
}
