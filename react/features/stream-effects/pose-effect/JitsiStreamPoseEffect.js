// @flow

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

import { POSE_CONNECTIONS } from '@mediapipe/pose';
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
export default class JitsiStreamPoseEffect {
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
    setCurrentPose: Function;
    startEffect: Function;
    stopEffect: Function;

    /**
     * Represents a modified video MediaStream track.
     *
     * @class
     * @param {Object} model - Meet model.
     * @param {Object} options - Segmentation dimensions.
     */
    constructor(model: Object, options: Object) {
        this._options = options;
        this._model = model;

        // Bind event handler so it is only bound once for every instance.
        this._onMaskFrameTimer = this._onMaskFrameTimer.bind(this);

        // Workaround for FF issue https://bugzilla.mozilla.org/show_bug.cgi?id=1388974
        this._outputCanvasElement = document.createElement('canvas');
        this._outputCanvasElement.getContext('2d');
        this._inputVideoElement = document.createElement('video');

        this._videoCanvas = document.createElement('canvas');

        this._currentPose = {};
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
     * Represents the run post processing.
     *
     * @returns {void}
     */
    runPostProcessing() {
        const track = this._stream.getVideoTracks()[0];
        const { height, width } = track.getSettings() ?? track.getConstraints();

        this._outputCanvasElement.height = height;
        this._outputCanvasElement.width = width;
        this._outputCanvasCtx.drawImage(this._inputVideoElement, 0, 0);
        // this._outputCanvasCtx.scale(-1, 1);
        // this._outputCanvasCtx.translate(-this._outputCanvasElement.width, 0);

        if (this._options.pose.viewOnCam) {
            const poses = this._currentPose;

            if (poses && poses[0] && poses[0]['keypoints'].length) {
                const connection_color = '#00FF00';
                const keypoint_color = '#FF0000';
                const num_connections = POSE_CONNECTIONS.length;
    
                for (let i = 0; i < num_connections; i++) {
                    const idx1 = POSE_CONNECTIONS[i][0];
                    const idx2 = POSE_CONNECTIONS[i][1];
    
                    this._outputCanvasCtx.lineWidth = 4;
                    this._outputCanvasCtx.beginPath();
                    this._outputCanvasCtx.moveTo(poses[0]['keypoints'][idx1].x, poses[0]['keypoints'][idx1].y);
                    this._outputCanvasCtx.strokeStyle = connection_color;
                    this._outputCanvasCtx.lineTo(poses[0]['keypoints'][idx2].x, poses[0]['keypoints'][idx2].y);
                    this._outputCanvasCtx.stroke();
                }
                            
                for (let i = 0; i < poses[0]['keypoints'].length; i++) {
                    const {x, y} = poses[0]['keypoints'][i];
    
                    this._outputCanvasCtx.lineWidth = 2;
                    this._outputCanvasCtx.beginPath();
                    this._outputCanvasCtx.fillStyle = keypoint_color;
                    this._outputCanvasCtx.arc(x, y, 2, 0, 2 * Math.PI);
                    this._outputCanvasCtx.fill();
                }
            }
        }

        if (this._options.pose.view3D){
            console.log('View 3D');
        }
    }

    /**
     * Represents the run Tensorflow Interference.
     *
     * @returns {void}
     */
    async runInference() {
        const height = this._inputVideoElement.height;
        const width = this._inputVideoElement.width;

        this._videoCanvasContext.drawImage(this._inputVideoElement, 0, 0, width, height);
        const data = this._videoCanvasContext.getImageData(0, 0, width, height);
        let frame = tf.browser.fromPixels(data);

        if (!frame || !frame.shape[0] || !frame.shape[1]) {
            console.error('runInference is failed. frame is empty');
            postMessage({ done: true });
            return;
        }

        const poses = await this._model.estimatePoses(frame, this._options);
        this._currentPose = poses;
    }

    /**
     * Loop function to render the background mask.
     *
     * @private
     * @returns {void}
     */
    _renderMask() {
        this.runInference();
        this.runPostProcessing();

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
        return jitsiLocalTrack.videoType === 'camera';
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

        this._videoCanvas.width = parseInt(width, 10);
        this._videoCanvas.height = parseInt(height, 10);
        this._videoCanvasContext = this._videoCanvas.getContext('2d');

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

        return this._outputCanvasElement.captureStream(parseInt(frameRate, 30));
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
