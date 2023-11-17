// @flow

import * as tf from '@tensorflow/tfjs';

import { POSE_CONNECTIONS } from '@mediapipe/pose';
import {
    CLEAR_TIMEOUT,
    TIMEOUT_TICK,
    SET_TIMEOUT,
    timerWorkerScript
} from './TimerWorker';

import * as THREE from 'three';

/**
 * Represents a modified MediaStream that adds effects to video background.
 * <tt>JitsiStreamBackgroundEffect</tt> does the processing of the original
 * video stream.
 */
export default class JitsiStreamPoseEffect {
    _model: Object;
    _options: Object;
    _stream: Object;
    _inputVideoElement: HTMLVideoElement;
    _onMaskFrameTimer: Function;
    _maskFrameTimerWorker: Worker;
    _outputCanvasElement: HTMLCanvasElement;
    _outputCanvasCtx: Object;
    _3DCanvasElement: HTMLCanvasElement;
    _3DCanvasCtx: Object;
    _videoCanvas: HTMLCanvasElement;
    _videoCanvasContext: Object;
    _renderMask: Function;
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

        // Workaround for FF issue https://bugzilla.mozilla.org/show_bug.cgi?id=1388974
        this._outputCanvasElement = document.createElement('canvas');
        this._outputCanvasElement.getContext('2d');
        this._inputVideoElement = document.createElement('video');
        this._3DCanvasElement = document.createElement('canvas');

        this._currentPose = {};
        this._cameraAngle = 0;
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

        const h_ratio = height / this._options.height;
        const w_ratio = width / this._options.width;

        if (this._options.pose.viewOnCam) {
            const poses = this._currentPose;

            if (poses && poses[0] && poses[0]['keypoints'].length) {
                const connection_color = '#00FF00';
                const keypoint_color = '#FF0000';
                const num_connections = POSE_CONNECTIONS.length;
    
                for (let i = 0; i < num_connections; i++) {
                    const idx1 = POSE_CONNECTIONS[i][0];
                    const idx2 = POSE_CONNECTIONS[i][1];

                    if (poses[0]['keypoints'][idx1].score < this._options.poseThres || poses[0]['keypoints'][idx2].score < this._options.poseThres)
                        continue;

                    const x1 = poses[0]['keypoints'][idx1].x * w_ratio;
                    const y1 = poses[0]['keypoints'][idx1].y * h_ratio;
                    const x2 = poses[0]['keypoints'][idx2].x * w_ratio;
                    const y2 = poses[0]['keypoints'][idx2].y * h_ratio;
    
                    this._outputCanvasCtx.lineWidth = 4;
                    this._outputCanvasCtx.beginPath();
                    this._outputCanvasCtx.moveTo(x1, y1);
                    this._outputCanvasCtx.strokeStyle = connection_color;
                    this._outputCanvasCtx.lineTo(x2, y2);
                    this._outputCanvasCtx.stroke();
                }
                            
                for (let i = 0; i < poses[0]['keypoints'].length; i++) {
                    const {x, y, score} = poses[0]['keypoints'][i];

                    if(score < this._options.poseThres)
                        continue;
    
                    const x1 = x * w_ratio;
                    const y1 = y * h_ratio;
    
                    this._outputCanvasCtx.lineWidth = 2;
                    this._outputCanvasCtx.beginPath();
                    this._outputCanvasCtx.fillStyle = keypoint_color;
                    this._outputCanvasCtx.arc(x1, y1, 2, 0, 2 * Math.PI);
                    this._outputCanvasCtx.fill();
                }
            }
        }

        if (this._options.pose.view3D){
            const poses = this._currentPose;
            if (poses && poses[0] && poses[0]['keypoints3D'].length) {
                while(this._scene.children.length > 0){ 
                    this._scene.remove(this._scene.children[0]); 
                }

                const bases = [
                    {x: 0, y: 0, z: 0},
                    {x: 100, y: 0, z: 0},
                    {x: 0, y: 100, z: 0},
                    {x: 0, y: 0, z: 100},
                ];
                const origin_colors = [
                    0xFF0000, 0x00FF00, 0x0000FF
                ];

                for (let i = 0; i < 3; i++) {
                    const linePoints = [
                        new THREE.Vector3(bases[0].x, bases[0].y, bases[0].z),
                        new THREE.Vector3(bases[i + 1].x, bases[i + 1].y, bases[i + 1].z)
                    ];

                    const lineGeom = new THREE.BufferGeometry().setFromPoints( linePoints );
                    const lineMat = new THREE.LineBasicMaterial( { color: origin_colors[i] } );
                    const line = new THREE.Line( lineGeom, lineMat );
                    this._scene.add(line);
                }

                const num_connections = POSE_CONNECTIONS.length;
                const projectedKeypoints = poses[0]['keypoints3D'];
                const vertices = [];

                for (let i = 0; i < projectedKeypoints.length; i++) {
                    if(projectedKeypoints[i].score < this._options.poseThres)
                        continue;

                    projectedKeypoints[i].x = -10 * projectedKeypoints[i].x;
                    projectedKeypoints[i].y = -10 * (projectedKeypoints[i].y - 1);
                    projectedKeypoints[i].z = -10 * projectedKeypoints[i].z;

                    vertices.push( projectedKeypoints[i].x, projectedKeypoints[i].y, projectedKeypoints[i].z );
                }

                for (let i = 0; i < num_connections; i++) {
                    const idx1 = POSE_CONNECTIONS[i][0];
                    const idx2 = POSE_CONNECTIONS[i][1];

                    if (projectedKeypoints[idx1].score < this._options.poseThres || projectedKeypoints[idx2].score < this._options.poseThres)
                        continue;

                    const linePoints = [
                        new THREE.Vector3(projectedKeypoints[idx1].x, projectedKeypoints[idx1].y, projectedKeypoints[idx1].z),
                        new THREE.Vector3(projectedKeypoints[idx2].x, projectedKeypoints[idx2].y, projectedKeypoints[idx2].z)
                    ];

                    const lineGeom = new THREE.BufferGeometry().setFromPoints( linePoints );
                    const lineMat = new THREE.LineBasicMaterial( { color: 0x000000 } );
                    const line = new THREE.Line( lineGeom, lineMat );
                    this._scene.add(line);
                }

                const pointsGeom = new THREE.BufferGeometry();
                pointsGeom.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
                const pointsMat = new THREE.PointsMaterial( { color: 0xFF0000 } );
                const points = new THREE.Points( pointsGeom, pointsMat );
                this._scene.add( points );

                // Camera
                const camRad = (this._cameraAngle * Math.PI) / 180;
                const camX = 60 * Math.cos(camRad);
                const camZ = 60 * Math.sin(camRad);

                this._camera.position.set(camX, 15, camZ);
                this._camera.lookAt(new THREE.Vector3(0, 7, 0));

                this._renderer.render(this._scene, this._camera);

                this._outputCanvasCtx.drawImage(this._3DCanvasElement, width - this._options.view3Dsize, height - this._options.view3Dsize);
                this._cameraAngle += 1;
            } 
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

        this._videoCanvasContext.drawImage(this._inputVideoElement, 0, 0, width, height, 0, 0, this._options.width, this._options.height);
        const data = this._videoCanvasContext.getImageData(0, 0, this._options.width, this._options.height);
        let frame = tf.browser.fromPixels(data);

        if (!frame || !frame.shape[0] || !frame.shape[1]) {
            console.error('runInference is failed. frame is empty');
            return;
        }
        const poses = await this._model.estimatePoses(frame, this._options);
        frame.dispose();
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

        this._3DCanvasElement.width = this._options.view3Dsize;
        this._3DCanvasElement.height = this._options.view3Dsize;

        this._videoCanvas = document.createElement('canvas');
        this._videoCanvas.width = this._options.width;
        this._videoCanvas.height = this._options.height;
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

        this._renderer = new THREE.WebGLRenderer({
            canvas: this._3DCanvasElement,
            antialias: true
        });
        this._scene = new THREE.Scene();
        this._renderer.setClearColor(0xeeeeee);
        this._camera = new THREE.PerspectiveCamera(30, this._3DCanvasElement.width / this._3DCanvasElement.height, 1, 100);
        this._camera.position.set(45, 15, 0);
        this._camera.lookAt(new THREE.Vector3(0, -2, 0));

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
