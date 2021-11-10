import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';
import { isEqual } from 'lodash';

import {
    CLEAR_TIMEOUT,
    TIMEOUT_TICK,
    SET_TIMEOUT,
    timerWorkerScript
} from './TimerWorker';
import { getReferenceData, inferenceFrame } from './utils/utils';

/**
 * Represents a modified MediaStream that detect effects from video.
 * <tt>FaceDetectEffect</tt> does the processing of the original
 * video stream.
 */
export default class FaceDetect {
    /**
     * Represents a modified video MediaStream track.
     */
    constructor(model, landmarkModel, patience = 10) {
        this._model = model;
        this._landmarkModel = landmarkModel;

        // Bind event handler so it is only bound once for every instance.
        this._onFrameTimer = this._onFrameTimer.bind(this);

        this._inputVideoElement = document.getElementById('localVideo_container');
        this._canvas = document.createElement('canvas');
        document.body.appendChild(this._canvas);
        this._canvas.className = 'face-detect-canvas';
        this._canvas.width = innerWidth;
        this._canvas.height = innerHeight;
        this._ctx = this._canvas.getContext('2d');
        // this._inputVideoElement = document.createElement('video');
        // document.body.appendChild(this._inputVideoElement);
        // const source = document.createElement('source');
        // source.src = 'room/libs/sample_data.mp4';
        // source.type = 'video/mp4';
        // this._inputVideoElement.appendChild(source);
        // this._inputVideoElement.autoplay = true;
        // this._inputVideoElement.controls = true;
        // this._inputVideoElement.id = 'sample';
        // this._inputVideoElement.play();

        this._nFrame = 1;
        this._patience = patience;
        this._refData = [];
        this._prevBox = [0, 0, 0, 0];
        this._isSleep = [];
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
        // Get face detect output
        const frame = tf.browser.fromPixels(this._inputVideoElement);
        if (!frame || !frame.shape[0] || !frame.shape[1]) {
            console.error('ERROR: runInference is failed');
            return;
        }

        if (this._nFrame <= this._patience) {
            const [data, ret, box] = await getReferenceData(this._model, this._landmarkModel, frame);
            console.log('getReferenceData:', data, ret, box);

            if (ret && !isEqual(box, this._prevBox)) {
                this._refData.push(data);
                this._nFrame += 1;
            }
            this._prevBox = box;
        } else {
            let [status, eyeClose, box, landmarks] = await inferenceFrame(this._model, this._landmarkModel, frame, this._refData);
            console.log('inferenceFrame:', status, eyeClose, box, landmarks, frame.shape);

            if (this._isSleep.length <= this._patience / 10) {
                this._isSleep.push(eyeClose * 1.0);
            } else {
                this._isSleep.pop();
                this._isSleep.push(eyeClose * 1.0);
                if (tf.mean(this._isSleep).arraySync() > 0.5) {
                    status = 1;
                }
            }

            const a = Math.min(innerWidth/1280, innerHeight/720);
            let dx = 0;
            let dy = (innerHeight - 720*a) / 2;

            this._ctx.clearRect(0, 0, innerWidth, innerHeight);
            this._ctx.beginPath();
            this._ctx.lineWidth = 2;
            this._ctx.strokeStyle = '#ffffff';
            this._ctx.rect(dx + box[0] * a, dy + box[1] * a, (box[2] - box[0])*a, (box[3] - box[1])*a);
            this._ctx.stroke();
        }
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
            timeMs: 1000
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
     * Starts loop to capture video frame and render the AR object.
     *
     * @param {MediaStream} stream - Stream to be used for processing.
     * @returns {MediaStream} - The stream with the applied effect.
     */
    startEffect() {
        this._frameTimerWorker = new Worker(timerWorkerScript, { name: 'face effect worker' });
        this._frameTimerWorker.onmessage = this._onFrameTimer;
        this._frameTimerWorker.postMessage({
            id: SET_TIMEOUT,
            timeMs: 1000 / 30
        });
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
