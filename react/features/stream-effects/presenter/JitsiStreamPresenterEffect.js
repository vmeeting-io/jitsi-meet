// @flow
/* global APP, config */

import { merge, trim } from 'lodash';
import { getLocalParticipant } from '../../base/participants';
import {
    CLEAR_INTERVAL,
    INTERVAL_TIMEOUT,
    SET_INTERVAL,
    timerWorkerScript
} from './TimeWorker';
import './jsTifier';

// Canvas size
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

/**
 * Represents a modified MediaStream that adds video as pip on a desktop stream.
 * <tt>JitsiStreamPresenterEffect</tt> does the processing of the original
 * desktop stream.
 */
export default class JitsiStreamPresenterEffect {
    _backgroundElement: HTMLImageElement;
    _canvas: HTMLCanvasElement;
    _ctx: CanvasRenderingContext2D;
    _desktopElement: HTMLVideoElement;
    _desktopStream: MediaStream;
    _frameRate: number;
    _onVideoFrameTimer: Function;
    _onVideoFrameTimerWorker: Function;
    _renderVideo: Function;
    _videoFrameTimerWorker: Worker;
    _videoElement: HTMLVideoElement;
    isEnabled: Function;
    startEffect: Function;
    stopEffect: Function;

    /**
     * Represents a modified MediaStream that adds a camera track at the
     * bottom right corner of the desktop track using a HTML canvas.
     * <tt>JitsiStreamPresenterEffect</tt> does the processing of the original
     * video stream.
     *
     * @param {MediaStream} videoStream - The video stream which is user for
     * creating the canvas.
     */
    constructor(videoStream: MediaStream) {
        const videoDiv = document.createElement('div');
        const firstVideoTrack = videoStream.getVideoTracks()[0];
        const { height, width, frameRate } = firstVideoTrack.getSettings() ?? firstVideoTrack.getConstraints();
        const localParticipant = getLocalParticipant(APP.store.getState());
        const [name, ...title] = localParticipant.name.split('/').map(trim);
        console.log('firstVideoTrack:', width, height, frameRate);

        this._name = name;
        this._title = title;
        this._canvas = document.createElement('canvas');
        this._ctx = this._canvas.getContext('2d');
        this._config = this._loadConfig();

        this._desktopElement = document.createElement('video');
        this._videoElement = document.createElement('video');
        this._backgroundElement = document.createElement('img');
        videoDiv.appendChild(this._videoElement);
        videoDiv.appendChild(this._desktopElement);
        videoDiv.appendChild(this._backgroundElement);
        if (document.body !== null) {
            document.body.appendChild(videoDiv);
        }

        const { pipMode, backgroundImageUrl } = this._config;
        const { w, h } = this._config.layout.presenter.rect;
        const maxWidth  = w;
        const maxHeight = h;

        // Set the video element properties
        this._frameRate = parseInt(frameRate, 10);
        this._videoElement.width = pipMode ? parseInt(width, 10) : Math.min(parseInt(width, 10), maxWidth);
        this._videoElement.height = pipMode ? parseInt(height, 10) : Math.min(parseInt(height, 10), maxHeight);
        this._videoElement.autoplay = true;
        this._videoElement.srcObject = videoStream;

        this._videoElement.play();

        // Set the background element properties
        if (!pipMode && backgroundImageUrl) {
            this._backgroundElement.src = backgroundImageUrl;
            this._backgroundElement.style = {
                'width': '100%',
                'object-fit': 'contain'
            };
        }

        // set the style attribute of the div to make it invisible
        videoDiv.style.display = 'none';

        // Bind event handler so it is only bound once for every instance.
        this._onVideoFrameTimer = this._onVideoFrameTimer.bind(this);
    }

    /**
     * EventHandler onmessage for the videoFrameTimerWorker WebWorker.
     *
     * @private
     * @param {EventHandler} response - The onmessage EventHandler parameter.
     * @returns {void}
     */
    _onVideoFrameTimer(response) {
        if (response.data.id === INTERVAL_TIMEOUT) {
            this._renderVideo();
        }
    }

    _getObjectFitSize(contains, width, height) {
        const dRatio = width / height;
        const cRatio = this._canvas.width / this._canvas.height;
        let targetWidth = 0;
        let targetHeight = 0;
        const test = contains ? (dRatio > cRatio) : (dRatio < cRatio);

        if (test) {
            targetWidth = this._canvas.width;
            targetHeight = targetWidth / dRatio;
        } else {
            targetHeight = this._canvas.height;
            targetWidth = targetHeight * dRatio;
        }

        return {
            w: targetWidth,
            h: targetHeight,
            x: (this._canvas.width - targetWidth) / 2,
            y: (this._canvas.height - targetHeight) / 2,
        };
    }

    /**
     * Loop function to render the video frame input and draw presenter effect.
     *
     * @private
     * @returns {void}
     */
    _renderVideo() {
        // adjust the canvas width/height on every frame incase the window has been resized.
        const [ track ] = this._desktopStream.getVideoTracks();
        const { height, width } = track.getSettings() ?? track.getConstraints();

        if (!this._config.pipMode) {
            this._canvas.width = CANVAS_WIDTH;
            this._canvas.height = CANVAS_HEIGHT;
    
            let rc = this._config.layout.desktop.rect;
            let { w, h } = rc;

            if (width >= height) {
                // width is 100%
                w = rc.w;
                h = parseInt(height * rc.w / width, 10);
            } else {
                // height is 100%
                h = rc.h;
                w = parseInt(width * rc.h / height, 10);
            }

            // adjust max width and height
            if (w > rc.w) {
                h = parseInt(h * rc.w / w, 10);
                w = rc.w;
            } else if (h > rc.h) {
                w = parseInt(w * rc.h / h, 10);
                h = rc.h;
            }
            // console.log('track:', width, height, w, h);

            this._ctx.drawImage(this._backgroundElement, 0, 0, this._canvas.width, this._canvas.height);
            this._ctx.drawImage(
                this._desktopElement,
                0, 0, width, height,
                parseInt(rc.x + (rc.w - w) / 2, 10), parseInt(rc.y + (rc.h - h) / 2, 10), w, h);

            rc = this._config.layout.presenter.rect;
            this._ctx.drawImage(this._videoElement, rc.x, rc.y, rc.w, rc.h);

            // draw a border around the video element.
            // const outline = this._config.layout.presenter.outline;
            // this._ctx.beginPath();
            // this._ctx.lineWidth = outline.width;
            // this._ctx.strokeStyle = outline.color; // dark grey
            // this._ctx.rect(rc.x, rc.y, rc.w, rc.h);
            // this._ctx.stroke();

            // draw presenter name
            let text = this._config.layout.presenter.name;
            let lineHeight = parseInt(text.fontSize * text.lineHeight, 10);
            let lineY = text.y;
            this._ctx.font = `${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`;
            this._ctx.fillStyle = text.color;
            this._ctx.mlFillText(this._name, text.x, lineY, rc.w, rc.h, 'top', 'center', lineHeight);
            lineY += lineHeight;

            text = this._config.layout.presenter.title;
            lineHeight = parseInt(text.fontSize * text.lineHeight, 10);
            this._ctx.font = `${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`;
            this._ctx.fillStyle = text.color;
            for (let title of this._title) {
                this._ctx.mlFillText(title, text.x, lineY, rc.w, rc.h, 'top', 'center', lineHeight);
                lineY += lineHeight;
            }
        } else {
            this._canvas.width = parseInt(width, 10);
            this._canvas.height = parseInt(height, 10);

            this._ctx.drawImage(this._desktopElement, 0, 0, this._canvas.width, this._canvas.height);
            this._ctx.drawImage(
                this._videoElement,
                this._canvas.width - this._videoElement.width,
                0,
                this._videoElement.width,
                this._videoElement.height);

            // draw a border around the video element.
            this._ctx.beginPath();
            this._ctx.lineWidth = 2;
            this._ctx.strokeStyle = '#A9A9A9'; // dark grey
            this._ctx.rect(this._canvas.width - this._videoElement.width, 0,
                this._videoElement.width, this._videoElement.height);
            this._ctx.stroke();
        }
    }

    /**
     * Load config to render the video frame input and draw presenter effect.
     *
     * @private
     * @returns {void}
     */
    _loadConfig() {
        const layout = merge({
            background: { w: 1280, h: 720 },
            desktop: { 
                rect: { x: 40, y: 142, w: 910, h: 512 },
            },
            presenter: {
                rect: { x: 978, y: 142, w: 180, h: 135 },
                outline: { color: '#A9A9A9', width: 2 },
                name: { color: 'white', fontSize: 18, fontWeight: 'normal', fontFamily: '맑은 고딕', lineHeight: 1.5, x: 978, y: 370 },
                title: { color: 'white', fontSize: 14, fontWeight: 'lighter', fontFamily: '맑은 고딕', lineHeight: 1.5, x: 978, y: 395 },
            }
        }, config.presenter?.layout);
        
        // map position from background to canvas
        const mapX = x => parseInt(CANVAS_WIDTH * x / layout.background.w, 10);
        const mapY = y => parseInt(CANVAS_HEIGHT * y / layout.background.h, 10);
        
        const _config = {
            backgroundImageUrl: config.presenter?.backgroundImageUrl || '',
            pipMode: config.presenter?.pipMode ?? true,
            layout: {
                desktop: {
                    rect: {
                        x: mapX(layout.desktop.rect.x),
                        y: mapY(layout.desktop.rect.y),
                        w: mapX(layout.desktop.rect.w),
                        h: mapY(layout.desktop.rect.h)
                    }
                },
                presenter: {
                    rect: {
                        x: mapX(layout.presenter.rect.x),
                        y: mapY(layout.presenter.rect.y),
                        w: mapX(layout.presenter.rect.w),
                        h: mapY(layout.presenter.rect.h),
                    },
                    outline: layout.presenter.outline,
                    name: {
                        ...layout.presenter.name,
                        x: mapX(layout.presenter.name.x),
                        y: mapY(layout.presenter.name.y)
                    },
                    title: {
                        ...layout.presenter.title,
                        x: mapX(layout.presenter.title.x),
                        y: mapY(layout.presenter.title.y),
                    },
                },
            }
        };

        console.log('config:', _config);

        return _config;
    }

    /**
     * Checks if the local track supports this effect.
     *
     * @param {JitsiLocalTrack} jitsiLocalTrack - Track to apply effect.
     * @returns {boolean} - Returns true if this effect can run on the
     * specified track, false otherwise.
     */
    isEnabled(jitsiLocalTrack: Object) {
        return jitsiLocalTrack.isVideoTrack() && jitsiLocalTrack.videoType === 'desktop';
    }

    /**
     * Starts loop to capture video frame and render presenter effect.
     *
     * @param {MediaStream} desktopStream - Stream to be used for processing.
     * @returns {MediaStream} - The stream with the applied effect.
     */
    startEffect(desktopStream: MediaStream) {
        const firstVideoTrack = desktopStream.getVideoTracks()[0];
        const { height, width } = firstVideoTrack.getSettings() ?? firstVideoTrack.getConstraints();

        // set the desktop element properties.
        this._desktopStream = desktopStream;
        this._desktopElement.width = parseInt(width, 10);
        this._desktopElement.height = parseInt(height, 10);
        this._desktopElement.autoplay = true;
        this._desktopElement.srcObject = desktopStream;

        // autoplay is not enough to start the video on Safari, it's fine to call play() on other platforms as well
        this._desktopElement.play();

        this._canvas.width = parseInt(width, 10);
        this._canvas.height = parseInt(height, 10);
        this._videoFrameTimerWorker = new Worker(timerWorkerScript, { name: 'Presenter effect worker' });
        this._videoFrameTimerWorker.onmessage = this._onVideoFrameTimer;
        this._videoFrameTimerWorker.postMessage({
            id: SET_INTERVAL,
            timeMs: 1000 / this._frameRate
        });

        return this._canvas.captureStream(this._frameRate);
    }

    /**
     * Stops the capture and render loop.
     *
     * @returns {void}
     */
    stopEffect() {
        this._videoFrameTimerWorker.postMessage({
            id: CLEAR_INTERVAL
        });
        this._videoFrameTimerWorker.terminate();
    }

}
