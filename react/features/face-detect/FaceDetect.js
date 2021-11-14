import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';

import {
    CLEAR_TIMEOUT,
    TIMEOUT_TICK,
    SET_TIMEOUT,
    timerWorkerScript
} from './TimerWorker';

/**
 * Represents a modified MediaStream that detect effects from video.
 * <tt>FaceDetectEffect</tt> does the processing of the original
 * video stream.
 */
export default class FaceDetect {
    /**
     * Represents a modified video MediaStream track.
     */
    constructor(patience = 100, showResult = false) {
        // Bind event handler so it is only bound once for every instance.
        this._frameInterval = 1000 / 30;
        this._initialized = false;
        this._isWaiting = false;
        this._showResult = showResult;

        this._inputVideo = document.getElementById('localVideo_container');
        this._worker = new Worker(new URL('./worker.js', import.meta.url));

        this._onFrameTimer = this._onFrameTimer.bind(this);
        this._onMessage = this._onMessage.bind(this);
        this._worker.onmessage = this._onMessage;
        this._worker.postMessage({ command: 'initialize', data: { patience } });
    }

    /**
     * EventHandler onmessage for the faceDetectTimerWorker WebWorker.
     *
     * @private
     * @param {EventHandler} response - The onmessage EventHandler parameter.
     * @returns {void}
     */
    _onFrameTimer(response: Object) {
        // console.log('_onFrameTimer:', response);
        if (response.data.id === TIMEOUT_TICK) {
            this._loop();
        }
    }

    /**
     * Represents the run OnnxRuntimeWeb Interference.
     *
     * @returns {void}
     */
    async runInference() {
        if (!this._initialized) {
            console.log('worker is not initialized.');
            return;
        }

        if (this._isWaiting) {
            return;
        }

        if (this._showResult && !this._ctx) {
            const largeVideo = document.getElementById('largeVideo');
            const rc = largeVideo.getClientRects()[0];
            console.log('video: clientRect', rc);
            
            this._rc = rc;
            this._width = rc.width;
            this._height = rc.height;
            this._canvas = document.createElement('canvas');
            document.body.appendChild(this._canvas);
            this._canvas.className = 'face-detect-canvas';
            this._canvas.width = largeVideo.videoWidth;
            this._canvas.height = largeVideo.videoHeight;
            this._canvas.style.left = this._rc.x;
            this._canvas.style.top = this._rc.y;
            this._canvas.style.width = `${this._width}px`;
            this._canvas.style.height = `${this._height}px`;
            this._ctx = this._canvas.getContext('2d');
        }
        
        this._inputVideo = document.getElementById('localVideo_container');
        if (!this._videoCanvas) {
            this._videoCanvas = document.createElement('canvas');
            this._videoCanvas.width = this._inputVideo.videoWidth;
            this._videoCanvas.height = this._inputVideo.videoHeight;
            this._videoContext = this._videoCanvas.getContext('2d');
        }

        // Get face detect output
        // console.time('inferenceImage');
        this._videoContext.drawImage(this._inputVideo, 0, 0, this._inputVideo.videoWidth, this._inputVideo.videoHeight);
        const frame = this._videoContext.getImageData(0, 0, this._inputVideo.videoWidth, this._inputVideo.videoHeight);
        this._worker.postMessage({ command: 'frame', data: frame });
        this._isWaiting = true;
        // console.timeEnd('inferenceImage');
    }

    _onMessage(event) {
        const result = event.data;

        if (!result.done) {
            console.error('onMessage is failed!', result);
            return;
        }

        if (!this._initialized) {
            if (result.data === 'initialized') {
                this._initialized = true;
                console.log('worker is initialized!');
                return;
            }
            console.error('worker is not initialized.');
            return;
        };

        if (!result.data) {
            this._isWaiting = !this._isWaiting;
            return;
        }

        const { status, eyeClose, box, landmarks } = result.data;
        console.log(`status=${status}, eyeClose=${eyeClose}`);
        this._frameInterval = 1000;

        if (this._showResult) {
            this._ctx.clearRect(0, 0, 1280, 720);
            this._ctx.beginPath();
            this._ctx.lineWidth = 2;
            this._ctx.strokeStyle = '#ff0000';
            this._ctx.rect(box[0], box[1], box[2] - box[0], box[3] - box[1]);
            this._ctx.stroke();
            this._ctx.font = `normal 18px 맑은 고딕`;
            this._ctx.fillStyle = '#00ff00';
            this._ctx.mlFillText(`${status}`, box[0] + 5, box[1] + 5, 100, 50, 'top', 'left', 20);
      
            if (landmarks.length) {
                // landmark5
                for (let i = 0; i < landmarks[0].length; i++) {
                    const [x, y] = landmarks[0][i];
                    this._ctx.beginPath();
                    this._ctx.strokeStyle = '#00ff00';
                    this._ctx.arc(x, y, 2, 0, 2 * Math.PI);
                    this._ctx.fill();
                }
      
                // face_landmarks
                let marks = landmarks[1]['left_eye'];
                for (let i = 0; i < marks.length; i++) {
                    const [x, y] = marks[i];
                    const scaled_x = (box[2] - box[0]) / 112 * x;
                    const scaled_y = (box[3] - box[1]) / 112 * y;
                    this._ctx.beginPath();
                    this._ctx.strokeStyle = '#00ff00';
                    this._ctx.arc(scaled_x + box[0], scaled_y + box[1], 2, 0, 2 * Math.PI);
                    this._ctx.fill();
                }
                marks = landmarks[1]['right_eye'];
                for (let i = 0; i < marks.length; i++) {
                    const [x, y] = marks[i];
                    const scaled_x = (box[2] - box[0]) / 112 * x;
                    const scaled_y = (box[3] - box[1]) / 112 * y;
                    this._ctx.beginPath();
                    this._ctx.strokeStyle = '#00ff00';
                    this._ctx.arc(scaled_x + box[0], scaled_y + box[1], 2, 0, 2 * Math.PI);
                    this._ctx.fill();
                }
            }
        }
        this._isWaiting = !this._isWaiting;
    }

    /**
     * Loop function to detect a face.
     *
     * @private
     * @returns {void}
     */
    _loop() {
        this.runInference();

        this._frameTimerWorker.postMessage({
            id: SET_TIMEOUT,
            timeMs: this._frameInterval
        });
    }

    /**
     * Starts loop to capture video frame and render the AR object.
     *
     * @param {MediaStream} stream - Stream to be used for processing.
     * @returns {MediaStream} - The stream with the applied effect.
     */
    startEffect() {
        this._frameTimerWorker = new Worker(timerWorkerScript, { name: 'face effect worker' });
        this._frameTimerWorker.onmessage = this._onFrameTimer;

        this._inputVideo.onloadeddata = () => {
            this._frameTimerWorker.postMessage({
                id: SET_TIMEOUT,
                timeMs: this._frameInterval
            });
        };
    }

    /**
     * Stops the capture and render loop.
     *
     * @returns {void}
     */
    stopEffect() {
        this._frameTimerWorker.postMessage({
            id: CLEAR_TIMEOUT
        });

        this._frameTimerWorker.terminate();
    }
};
