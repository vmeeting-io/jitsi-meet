// @flow

import * as tf from '@tensorflow/tfjs';
import PerspT from 'perspective-transform';

import {
    CLEAR_TIMEOUT,
    TIMEOUT_TICK,
    SET_TIMEOUT,
    timerWorkerScript
} from './TimerWorker';

/**
 * Represents a modified MediaStream that adds effects to video background.
 * <tt>JitsiStreamBackgroundEffect</tt> does the processing of the original
 * video stream.
 */
export default class JitsiStreamAREffect {
    _model: Object;
    _options: Object;
    _stream: Object;
    _segmentationPixelCount: number;
    _inputVideoElement: HTMLVideoElement;
    _onMaskFrameTimer: Function;
    _maskFrameTimerWorker: Worker;
    _outputCanvasElement: HTMLCanvasElement;
    _outputCanvasCtx: Object;
    _segmentationMaskCtx: Object;
    _segmentationMask: Object;
    _segmentationMaskCanvas: Object;
    _renderMask: Function;
    _virtualImage: HTMLImageElement;
    _virtualVideo: HTMLVideoElement;
    isEnabled: Function;
    startEffect: Function;
    stopEffect: Function;

    /**
     * Represents a modified video MediaStream track.
     *
     * @class
     * @param {Object} model - Meet model.
     * @param {Object} options - Segmentation dimensions.
     */
    constructor(faceMesh: Object, options: Object) {
        this._options = options;
        this._faceMesh = faceMesh;

        // Bind event handler so it is only bound once for every instance.
        this._onMaskFrameTimer = this._onMaskFrameTimer.bind(this);

        // Workaround for FF issue https://bugzilla.mozilla.org/show_bug.cgi?id=1388974
        this._outputCanvasElement = document.createElement('canvas');
        this._outputCanvasElement.getContext('2d');

        this._inputVideoElement = document.createElement('video');

        this._faceMeshCanvas = document.createElement('canvas');

        this._arCanvas = document.createElement('canvas');
        this._arCanvas2 = document.createElement('canvas');

        this._arObj = document.createElement('img');
        this._arObj.crossOrigin = 'anonymous';
        this._arObj.src = 'images/ar-object/birthday_hat_sq_center3.png';
    }

    /**
     * EventHandler onmessage for the maskFrameTimerWorker WebWorker.
     *
     * @private
     * @param {EventHandler} response - The onmessage EventHandler parameter.
     * @returns {void}
     */
    _onMaskFrameTimer(response: Object) {
        if (response.data.id === TIMEOUT_TICK) {
            this._renderMask();
        }
    }


    /**
     * Represents the run Tensorflow Interference.
     *
     * @returns {void}
     */
    async runInference() {
        const track = this._stream.getVideoTracks()[0];
        const { height, width } = track.getSettings() ?? track.getConstraints();

        //this._arCanvasCtx.drawImage(this._arObj, 0, 0, this._arObj.width, this._arObj.height, 0, 0, this._arCanvas.width, this._arCanvas.height);
        this._faceMeshCanvasCtx.drawImage(this._inputVideoElement, 0, 0);
        const predictions = await this._faceMesh.estimateFaces({input: this._faceMeshCanvas, predictIrises: false});
        this._outputCanvasCtx.drawImage(this._inputVideoElement, 0, 0);

        for (let i = 0; i < predictions.length; i++) {
            const keypoints = predictions[i].scaledMesh;

            /*for (let i = 0; i < keypoints.length; i++) {
                const x = keypoints[i][0];
                const y = keypoints[i][1];
                this._outputCanvasCtx.beginPath();
                this._outputCanvasCtx.arc(x, y, 1, 0, 3 * Math.PI);
                this._outputCanvasCtx.fillStyle = "aqua";
                this._outputCanvasCtx.fill();
            }*/
            
            /*const src_points = [
                {x: 324, y: 530},
                {x: 676, y: 530},
            ];*/
            const src_points = [
                {x: 308, y: 530},
                {x: 692, y: 530},
            ];

            const head_top = {x: keypoints[10][0], y: keypoints[10][1]};
            const dst_points = [
                {x: keypoints[21][0], y: keypoints[21][1]},
                {x: keypoints[251][0], y: keypoints[251][1]}
            ];

            const hScaling = (dst_points[1].x - dst_points[0].x) / (src_points[1].x - src_points[0].x);
            const hTrans = head_top.x - this._arCanvas.width / 2;
            const vTrans = head_top.y - this._arCanvas.height / 2;
            const angle = Math.atan2(dst_points[1].y - dst_points[0].y, dst_points[1].x - dst_points[0].x);

            this._arCanvasCtx.resetTransform();
            this._arCanvasCtx.clearRect(0, 0, this._arCanvas.width, this._arCanvas.height);
            this._arCanvas2Ctx.resetTransform();
            this._arCanvas2Ctx.clearRect(0, 0, this._arCanvas2.width, this._arCanvas2.height);

            const objScalingFactor = Math.min(this._outputCanvasElement.width, this._outputCanvasElement.height) / this._arObj.width;
            const sizeCheck = this._arCanvas.width > this._arCanvas.height? true : false;
            const xLoc = sizeCheck? (this._arCanvas.width - this._arCanvas.height) / 2 : 0;
            const yLoc = sizeCheck? 0 : (this._arCanvas.height - this._arCanvas.width) / 2;
            const xySize = sizeCheck? this._arCanvas.height : this._arCanvas.width;
            const scalingFactor = hScaling / objScalingFactor;

            this._arCanvasCtx.translate(this._arCanvas.width / 2, this._arCanvas.height / 2);
            this._arCanvasCtx.rotate(angle);
            this._arCanvasCtx.translate(-this._arCanvas.width / 2, -this._arCanvas.height / 2);
            this._arCanvasCtx.drawImage(this._arObj, xLoc, yLoc, xySize, xySize);

            this._arCanvas2Ctx.translate(this._arCanvas.width / 2, this._arCanvas.height / 2);
            this._arCanvas2Ctx.scale(1.2 * scalingFactor, 1.2 * scalingFactor);
            this._arCanvas2Ctx.translate(-this._arCanvas.width / 2, -this._arCanvas.height / 2);

            this._arCanvas2Ctx.drawImage(this._arCanvas, 0, 0);

            this._arCanvasCtx.resetTransform();
            this._arCanvasCtx.clearRect(0, 0, this._arCanvas.width, this._arCanvas.height);

            this._arCanvasCtx.translate(hTrans, vTrans);
            this._arCanvasCtx.drawImage(this._arCanvas2, 0, 0);

            this._outputCanvasCtx.drawImage(this._arCanvas, 0, 0, this._outputCanvasElement.width, this._outputCanvasElement.height);
        }
    }

    /**
     * Loop function to render the background mask.
     *
     * @private
     * @returns {void}
     */
    _renderMask() {
        this.runInference();

        this._maskFrameTimerWorker.postMessage({
            id: SET_TIMEOUT,
            timeMs: 1000 / 30
        });
    }

    /**
     * Checks if the local track supports this effect.
     *
     * @param {JitsiLocalTrack} jitsiLocalTrack - Track to apply effect.
     * @returns {boolean} - Returns true if this effect can run on the specified track
     * false otherwise.
     */
    isEnabled(jitsiLocalTrack: Object) {
        return jitsiLocalTrack.isVideoTrack() && jitsiLocalTrack.videoType === 'camera';
    }

    /**
     * Starts loop to capture video frame and render the segmentation mask.
     *
     * @param {MediaStream} stream - Stream to be used for processing.
     * @returns {MediaStream} - The stream with the applied effect.
     */
    startEffect(stream: MediaStream) {
        this._stream = stream;
        this._maskFrameTimerWorker = new Worker(timerWorkerScript, { name: 'Blur effect worker' });
        this._maskFrameTimerWorker.onmessage = this._onMaskFrameTimer;
        const firstVideoTrack = this._stream.getVideoTracks()[0];
        const { height, frameRate, width }
            = firstVideoTrack.getSettings ? firstVideoTrack.getSettings() : firstVideoTrack.getConstraints();

        this._outputCanvasElement.width = parseInt(width, 10);
        this._outputCanvasElement.height = parseInt(height, 10);
        this._outputCanvasCtx = this._outputCanvasElement.getContext('2d');
        this._inputVideoElement.width = parseInt(width, 10);
        this._inputVideoElement.height = parseInt(height, 10);
        this._inputVideoElement.autoplay = true;
        this._inputVideoElement.srcObject = this._stream;
        this._inputVideoElement.onloadeddata = () => {
            this._maskFrameTimerWorker.postMessage({
                id: SET_TIMEOUT,
                timeMs: 1000 / 30
            });
        };

        this._arCanvas.width = this._outputCanvasElement.width;
        this._arCanvas.height = this._outputCanvasElement.height;
        this._arCanvasCtx = this._arCanvas.getContext('2d');

        this._arCanvas2.width = this._outputCanvasElement.width;
        this._arCanvas2.height = this._outputCanvasElement.height;
        this._arCanvas2Ctx = this._arCanvas2.getContext('2d');

        this._faceMeshCanvas.width = this._inputVideoElement.width;
        this._faceMeshCanvas.height = this._inputVideoElement.height;
        this._faceMeshCanvasCtx = this._faceMeshCanvas.getContext('2d');

        return this._outputCanvasElement.captureStream(parseInt(frameRate, 10));
    }

    /**
     * Stops the capture and render loop.
     *
     * @returns {void}
     */
    stopEffect() {
        this._maskFrameTimerWorker.postMessage({
            id: CLEAR_TIMEOUT
        });

        this._maskFrameTimerWorker.terminate();
    }
}
