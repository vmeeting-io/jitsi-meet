// @flow

import {
    CLEAR_TIMEOUT,
    TIMEOUT_TICK,
    SET_TIMEOUT,
    timerWorkerScript
} from './TimerWorker';

import * as drawingUtils from '@mediapipe/drawing_utils';
import * as mpFaceMesh from '@mediapipe/face_mesh';

/**
 * Represents a modified MediaStream that adds effects to video background.
 * <tt>JitsiStreamVirtualAvatarEffect</tt> does the processing of the original
 * video stream.
 */
export default class JitsiStreamVirtualAvatarEffect {
    _model: Object;
    _options: Object;
    _stream: Object;
    _inputVideoElement: HTMLVideoElement;
    _onMaskFrameTimer: Function;
    _maskFrameTimerWorker: Worker;
    _outputCanvasElement: HTMLCanvasElement;
    _outputCanvasCtx: Object;
    _onResults: Function;
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
    constructor(model: Object, options: Object) {
        this._options = options;

        this._model = model;

        // Bind event handler so it is only bound once for every instance.
        this._onMaskFrameTimer = this._onMaskFrameTimer.bind(this);
        this._onResults = this._onResults.bind(this);


        // Workaround for FF issue https://bugzilla.mozilla.org/show_bug.cgi?id=1388974
        this._outputCanvasElement = document.createElement('canvas');
        this._outputCanvasElement.getContext('2d');
        this._inputVideoElement = document.createElement('video');
        this._model.onResults(this._onResults);
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
            this._inferenceLoop();
        }
    }


    /**
     * Loop function to render the background mask.
     *
     * @private
     * @returns {void}
     */
    async _inferenceLoop() {

        await this._model.send({ image: this._inputVideoElement });

        this._maskFrameTimerWorker.postMessage({
            id: SET_TIMEOUT,
            timeMs: 1000 / 50
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

    _onResults(results) {
        // Draw the overlays.
        this._outputCanvasCtx.save();
        this._outputCanvasCtx.clearRect(0, 0, this._outputCanvasElement.width, this._outputCanvasElement.height);
        // this._outputCanvasCtx.drawImage(
        //     results.image, 0, 0, this._outputCanvasElement.width, this._outputCanvasElement.height);
        if (results.multiFaceLandmarks) {
            for (const landmarks of results.multiFaceLandmarks) {
                drawingUtils.drawConnectors(
                    this._outputCanvasCtx, landmarks, mpFaceMesh.FACEMESH_TESSELATION,
                    { color: '#C0C0C070', lineWidth: 1 });
                drawingUtils.drawConnectors(
                    this._outputCanvasCtx, landmarks, mpFaceMesh.FACEMESH_RIGHT_EYE,
                    { color: '#FF3030' });
                drawingUtils.drawConnectors(
                    this._outputCanvasCtx, landmarks, mpFaceMesh.FACEMESH_RIGHT_EYEBROW,
                    { color: '#FF3030' });
                drawingUtils.drawConnectors(
                    this._outputCanvasCtx, landmarks, mpFaceMesh.FACEMESH_LEFT_EYE,
                    { color: '#30FF30' });
                drawingUtils.drawConnectors(
                    this._outputCanvasCtx, landmarks, mpFaceMesh.FACEMESH_LEFT_EYEBROW,
                    { color: '#30FF30' });
                drawingUtils.drawConnectors(
                    this._outputCanvasCtx, landmarks, mpFaceMesh.FACEMESH_FACE_OVAL,
                    { color: '#E0E0E0' });
                drawingUtils.drawConnectors(
                    this._outputCanvasCtx, landmarks, mpFaceMesh.FACEMESH_LIPS, { color: '#E0E0E0' });
                // if (solutionOptions.refineLandmarks) {
                //     drawingUtils.drawConnectors(
                //         this._outputCanvasCtx, landmarks, mpFaceMesh.FACEMESH_RIGHT_IRIS,
                //         { color: '#FF3030' });
                //     drawingUtils.drawConnectors(
                //         this._outputCanvasCtx, landmarks, mpFaceMesh.FACEMESH_LEFT_IRIS,
                //         { color: '#30FF30' });
                // }
            }
        }
        this._outputCanvasCtx.restore();
    }

    /**
     * Starts loop to capture video frame and render the segmentation mask.
     *
     * @param {MediaStream} stream - Stream to be used for processing.
     * @returns {MediaStream} - The stream with the applied effect.
     */
    startEffect(stream: MediaStream) {
        this._stream = stream;
        this._maskFrameTimerWorker = new Worker(timerWorkerScript, { name: 'virtual avatar effect worker' });
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
