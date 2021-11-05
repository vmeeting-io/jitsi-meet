import '@tensorflow/tfjs-backend-cpu';
import * as tf from '@tensorflow/tfjs-core';

import {
    CLEAR_TIMEOUT,
    TIMEOUT_TICK,
    SET_TIMEOUT,
    timerWorkerScript
} from './TimerWorker';
import { normalize_frame, predict_BB } from './utils/utils';

/**
 * Represents a modified MediaStream that detect effects from video.
 * <tt>FaceDetectEffect</tt> does the processing of the original
 * video stream.
 */
export default class FaceDetect {
    /**
     * Represents a modified video MediaStream track.
     */
    constructor(model, landmarkModel) {
        this._model = model;
        this._landmarkModel = landmarkModel;

        // Bind event handler so it is only bound once for every instance.
        this._onFrameTimer = this._onFrameTimer.bind(this);

        this._inputVideoElement = document.getElementById('localVideo_container');
    }

    /**
     * EventHandler onmessage for the faceDetectTimerWorker WebWorker.
     *
     * @private
     * @param {EventHandler} response - The onmessage EventHandler parameter.
     * @returns {void}
     */
    _onFrameTimer(response: Object) {
        console.log('_onFrameTimer:', response);
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
        // Get face detect result
        const frame = tf.browser.fromPixels(this._inputVideoElement);
        // const frame = tf.image.resizeBilinear(video, [180, 320]);
        const frame_normed = normalize_frame(frame);
        // const input = tf.sub(tf.div(tf.expandDims(img), 127.5), 1);
        console.log(this._model, frame.shape);
        const result = await this._model.predict(frame_normed);
        const confidences = result['PartitionedCall:1'];
        const boxes = result['PartitionedCall:0'];
        const result1 = await predict_BB(frame.shape[1], frame.shape[0], confidences, boxes, 0.7);
        console.log('face-detect:', result1);
        result1.print(); // return in Tensor

        // const { ret } = this.postProcess(landmarks, faces[0]);
        // let status = ret === 0 ? 0 : 1; // 정면이면 0(집중), 그렇지 않으면 1(비집중)

        // if (faces.length) {
        //     console.log('face detect:', faces, landmarks);
        // } else {
        //     status = 2; // 자리이탈
        // }

        // return {
        //     faces: faces.length,
        //     status,
        //     direction: faces.length === 1 ? ret : 5
        // };
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
