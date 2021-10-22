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
export default class FaceDetectEffect {

    _faceDetectTimerWorker: Worker;
    isEnabled: Function;
    startEffect: Function;
    stopEffect: Function;

    /**
     * Represents a modified video MediaStream track.
     */
    constructor() {
        // Bind event handler so it is only bound once for every instance.
        this._onFaceDetectTimer = this._onFaceDetectTimer.bind(this);

        this._inputVideoElement = document.createElement('video');
        this._faceDetectCanvas = document.createElement('canvas');
    }

    /**
     * EventHandler onmessage for the faceDetectTimerWorker WebWorker.
     *
     * @private
     * @param {EventHandler} response - The onmessage EventHandler parameter.
     * @returns {void}
     */
    _onMaskFrameTimer(response: Object) {
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
        this._faceCanvasCtx.drawImage(this._inputVideoElement, 0, 0, this._canvasElement.width, this._canvasElement.height);
        const { faces, landmarks } = await this._faceDetect.inference({input: this._canvasElement, threshold:0.5, scale=1.0});
        const { ret } = this.postProcess(landmarks, faces[0]);
        let status = ret === 0 ? 0 : 1; // 정면이면 0(집중), 그렇지 않으면 1(비집중)

        if (faces.length) {
            console.log('face detect:', faces, landmarks);
        } else {
            status = 2; // 자리이탈
        }

        return {
            faces: faces.length,
            status,
            direction: faces.length === 1 ? ret : 5
        };
    }

    /**
     * Loop function to detect a face.
     *
     * @private
     * @returns {void}
     */
    _loop() {
        this.runInference();

        this._faceDetectTimerWorker.postMessage({
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
        this._faceDetectTimerWorker.postMessage({
            id: CLEAR_TIMEOUT
        });

        this._faceDetectTimerWorker.terminate();
    }
};

