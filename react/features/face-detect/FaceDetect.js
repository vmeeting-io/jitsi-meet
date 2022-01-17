import { uniq } from 'lodash';

import { getCurrentConference, STATUS_COMMAND } from '../base/conference';
import { getLocalParticipant, participantPresenceChanged } from '../base/participants';
import { isParticipantVideoMuted } from '../base/tracks';
import { isPrejoinPageVisible } from '../prejoin/functions';
import { setAttentionAnalysisReady } from './actions';
import { STATUS_TABLE } from './constants';
import { getAttentionAnalysisReady, isAttentionAnalysisEnabled } from './functions';

const threshold = 3;

/* state diagram
 *
 * INITIALIZE -> REFERENCE -> RECORDING -> STARTED
 */
const STEP = {
    INITIALIZE: 'INITIALIZE',
    REFERENCE: 'REFERENCE',
    RECORDING: 'RECORDING',
    STARTED: 'STARTED',
};

/**
 * Represents a modified MediaStream that detect effects from video.
 * <tt>FaceDetectEffect</tt> does the processing of the original
 * video stream.
 */
export default class FaceDetect {
    /**
     * Represents a modified video MediaStream track.
     */
    constructor(dispatch, getState) {
        const state = getState();
        const { faceDetect = {} } = state['features/base/config'].testing || {};
        const {
            referenceInterval = (1000 / 5),
            frameInterval = 1000,
            patience,
            showResult = false
        } = faceDetect;

        // Bind event handler so it is only bound once for every instance.
        this._dispatch = dispatch;
        this._getState = getState;
        this._frameInterval = referenceInterval;
        this._isWaiting = true;
        this._showResult = showResult;
        this._enabled = false;
        this._prevStatus = null;
        this._timerId = null;
        this._timestamp = 0;
        this._frames = [];
        this._patience = patience;
        this._statusList = [];

        this._inputVideo = document.getElementById('localVideo_container');

        this._worker = new Worker(
            new URL('./worker.js', import.meta.url),
            { name: 'worker', type: 'module' }
        );

        this._onMessage = this._onMessage.bind(this);
        this._worker.onmessage = this._onMessage;
        this._step = STEP.INITIALIZE;
        this._worker.postMessage({
            command: 'initialize',
            nms: 0.4,
            patience,
            next: STEP.REFERENCE
        });
        this._loop = this._loop.bind(this);
    }

    /**
     * Represents the run OnnxRuntimeWeb Interference.
     *
     * @returns {void}
     */
    async runInference() {
        if (this._isWaiting) {
            return;
        }

        if (this._step === STEP.INITIALIZE) {
            // console.log('face-detect worker is not initialized.');
            return;
        }

        this._inputVideo = document.getElementById('localVideo_container');
        if (!this._inputVideo) {
            this._frameInterval = 1000;
            // console.warn('localVideo_container not found!');
            return;
        }

        const { videoWidth, videoHeight } = this._inputVideo;
        if (!this._videoCanvas && videoWidth > 0 && videoHeight > 0) {
            this._videoCanvas = document.createElement('canvas');
            this._videoCanvas.width = videoWidth;
            this._videoCanvas.height = videoHeight;
            this._videoContext = this._videoCanvas.getContext('2d');
            console.log('videoCanvas:', videoWidth, videoHeight);
        }

        if (this._enabled) {
            const state = this._getState();
            const participant = getLocalParticipant(state);
            const videoMuted = isParticipantVideoMuted(participant, state);

            if (videoMuted) {
                this._updateParticipantStatus(2);
            } else if (this._videoCanvas) {
                try {
                    // Get face detect output
                    // console.time('inferenceImage');
                    this._videoContext.drawImage(this._inputVideo, 0, 0, videoWidth, videoHeight);
                    const frame = this._videoContext.getImageData(0, 0, videoWidth, videoHeight);
                    if (this._step === STEP.STARTED) {
                        this._worker.postMessage({
                            command: 'frame',
                            data: frame
                        });
                        this._isWaiting = true;
                    } else if (this._step === STEP.REFERENCE) {
                        this._worker.postMessage({
                            command: 'reference',
                            data: frame,
                            next: STEP.RECORDING
                        });
                        this._isWaiting = true;
                    } else if (this._step === STEP.RECORDING) {
                        this._frames.push(frame);
                        if (this._frames.length > this._patience) {
                            this._frames.shift();
                        }
                        if (this._frames.length === this._patience
                            && !getAttentionAnalysisReady(state)) {
                            this._dispatch(setAttentionAnalysisReady(true));
                        }
                    }
                    // console.timeEnd('inferenceImage');
                } catch (e) {
                    // ignore
                    // console.error(e);
                }
            }
        }
    }

    _onMessage(event) {
        const { done, data, next } = event.data;

        if (!done) {
            console.error('onMessage is failed!', result);
            return;
        }

        this._isWaiting = false;

        if (next) {
            this._step = next;
        }

        if (!data) {
            return;
        }

        let { status, eyeClose, box, landmarks = [] } = data;
        // console.log(`status=${status}, eyeClose=${eyeClose}`);

        const largeVideo = document.getElementById('largeVideo');
        const rc = largeVideo.getClientRects()[0];
        const { videoWidth, videoHeight } = this._inputVideo || {};

        if (rc && videoWidth > 0 && videoHeight > 0 && this._showResult) {
            // console.log('video: clientRect', rc);
            
            // transform 640x640 to 1280x720
            box = box.map((p, i) => i % 2 == 0 ? p * videoWidth / 640 : p * videoHeight / 640);
            if (landmarks.length) {
                landmarks = landmarks.map(m => m.map((p, i) => i % 2 == 0 ? p * videoWidth / 640 : p * videoHeight / 640));
            }
        
            if (!this._canvas) {
                console.log('largeVideo.canvas:', videoWidth, videoHeight);
                this._canvas = document.createElement('canvas');
                document.body.appendChild(this._canvas);
                this._canvas.className = 'face-detect-canvas';
                this._canvas.width = videoWidth;
                this._canvas.height = videoHeight;
            }
            this._canvas.style.left = rc.x;
            this._canvas.style.top = rc.y;
            this._canvas.style.width = `${rc.width}px`;
            this._canvas.style.height = `${rc.height}px`;
            this._ctx = this._canvas?.getContext('2d');
            
            this._ctx.clearRect(0, 0, videoWidth, videoHeight);
            if (!this._enabled) return;

            this._ctx.beginPath();
            this._ctx.lineWidth = 2;
            this._ctx.strokeStyle = '#ff0000';
            this._ctx.rect(box[0], box[1], box[2] - box[0], box[3] - box[1]);
            this._ctx.stroke();
            this._ctx.font = `normal 18px 맑은 고딕`;
            this._ctx.fillStyle = '#00ff00';
            this._ctx.mlFillText(`${status}`, box[0] + 5, box[1] + 5, 100, 50, 'top', 'left', 20);
            // eyeClose
            this._ctx.mlFillText(`eyeClose: ${Boolean(eyeClose)}`, box[0] + 5, box[1] + 30, 200, 50, 'top', 'left', 20);
      
            if (landmarks.length) {
                // landmark5
                for (let i = 0; i < landmarks.length; i++) {
                    const [x, y] = landmarks[i];
                    this._ctx.beginPath();
                    this._ctx.strokeStyle = '#00ff00';
                    this._ctx.arc(x, y, 2, 0, 2 * Math.PI);
                    this._ctx.fill();
                }
            }
        }

        if (this._step !== STEP.STARTED) {
            return;
        }

        this._statusList.push(status);
        if (this._statusList.length > threshold) {
            this._statusList.shift();
        }

        // 튀는 값을 정리하기 위해서...
        // threshold 동안 모든 값이 동일한 경우만 상태 업데이트를 진행
        const unique = uniq(this._statusList);
        if (unique.length === 1) {
            this._updateParticipantStatus(status);
        }
    }

    _updateParticipantStatus(status) {
        const statusValue = STATUS_TABLE[status];

        if (statusValue && statusValue !== this._prevStatus) {
            this._prevStatus = statusValue;
            this.sendPresence();
        }
    }

    /**
     * Loop function to detect a face.
     *
     * @private
     * @returns {void}
     */
    async _loop(timestamp) {
        try {
            if ((timestamp - this._timestamp) > this._frameInterval) {
                this._timestamp = timestamp;
                await this.runInference();
                
                this._enabled = isAttentionAnalysisEnabled(this._getState());
            }
        } finally {
            this._timerId = requestAnimationFrame(this._loop);
        }
        
    }

    /**
     * Starts loop to capture video frame and render the AR object.
     *
     * @param {MediaStream} stream - Stream to be used for processing.
     * @returns {MediaStream} - The stream with the applied effect.
     */
    init() {
        this._step = STEP.REFERENCE;
        this._timerId = requestAnimationFrame(this._loop);
    }

    /**
     * Start the inference.
     *
     * @returns {void}
     */
    start() {
        if (this._step !== STEP.STARTED) {
            const { faceDetect = {} } = this._getState()['features/base/config'].testing || {};
            const { frameInterval = 1000 } = faceDetect;

            this._frameInterval = frameInterval;
            this._worker.postMessage({
                command: 'inference',
                data: this._frames.slice(1),
                next: STEP.STARTED,
            });
            this._frames = [];
            this._isWaiting = true;
        }
    }

    /**
     * Pause the inference
     * 
     * @return {void}
     */
    pause() {
        console.log('==> faceDetect.pause()');
        if (this._timerId) {
            cancelAnimationFrame(this._timerId);
            this._timerId = null;
        }
    }

    /**
     * Resume the inference
     * 
     * @return {void}
     */
    resume() {
        console.log('==> faceDetect.resume()');
        if (!this._timerId) {
            this._timestamp = 0;
            this._timerId = requestAnimationFrame(this._loop);
        }
    }

    /**
     * Check whether the inference is running or not
     */
    isRunning() {
        return this._timerId && this._step === STEP.STARTED;
    }

    /**
     * Check whether the inference is paused or not
     */
    isPaused() {
        return !this._timerId && this._step === STEP.STARTED;
    }

    /**
     * Send presence status to other participants
     */
    sendPresence(newPresence) {
        if (newPresence) {
            this._prevStatus = newPresence;
        }

        const state = this._getState();
        const conference = getCurrentConference(state);
        const participant = getLocalParticipant(state);
        const statusValue = this._prevStatus || STATUS_TABLE[0];

        console.log(`==> faceDetect.sendPresence('${this._prevStatus}')`);
        if (conference && participant && statusValue) {
            conference.sendCommand(STATUS_COMMAND, { value: statusValue });
            this._dispatch(participantPresenceChanged(participant.id, statusValue));
        }
    }

    /**
     * Stops the capture and render loop.
     *
     * @returns {void}
     */
    stop() {
        if (this._timerId) {
            cancelAnimationFrame(this._timerId);
            this._timerId = null;
        }
        this._frames = [];
    }
};
