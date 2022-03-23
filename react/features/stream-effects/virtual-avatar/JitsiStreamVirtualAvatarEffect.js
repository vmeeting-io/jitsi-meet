// @flow

import {
    CLEAR_TIMEOUT,
    TIMEOUT_TICK,
    SET_TIMEOUT,
    timerWorkerScript
} from './TimerWorker';

import * as drawingUtils from '@mediapipe/drawing_utils';
import * as mpHolistic from '@mediapipe/holistic';
import * as mpFacemesh from '@mediapipe/face_mesh';
import { Face, Pose, Hand, Utils, Vector } from "kalidokit";
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { updateSettings } from '../../base/settings';
import { getLocalVideoTrack } from '../../base/tracks';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';

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
    _onResults: Function;
    isEnabled: Function;
    startEffect: Function;
    stopEffect: Function;
    gltf: Object;
    renderer: Object;
    orbitCamera: Object;
    scene: Object;
    clock: Object;
    animate: Function;
    rigRotation: Function;
    rigFace: Function;
    oldLookTarget: Object;
    animate3DModel: Function;
    load3DModel: Function;
    setBackground: Function;
    // count the number of services currently access the singleton object
    // (e.g., preview and real virtual avatar)
    usedServices: Number;
    initFacemeshModel: Function;
    outputStream: Object;

    leftEye: Object;
    rightEye: Object;
    headMesh: Object;

    /**
     * Represents a modified video MediaStream track.
     *
     * @class
     * @param {Object} options - Segmentation dimensions.
     */
    constructor(options: Object) {
        // singleton
        if (JitsiStreamVirtualAvatarEffect._instance) {
            return JitsiStreamVirtualAvatarEffect._instance
        }
        JitsiStreamVirtualAvatarEffect._instance = this;


        this._options = options;

        // Bind event handler so it is only bound once for every instance.
        this._onMaskFrameTimer = this._onMaskFrameTimer.bind(this);
        this._onResults = this._onResults.bind(this);
        this.animate = this.animate.bind(this);
        this.rigRotation = this.rigRotation.bind(this);
        this.rigFace = this.rigFace.bind(this);
        this.animate3DModel = this.animate3DModel.bind(this);
        this.load3DModel = this.load3DModel.bind(this);
        this.setBackground = this.setBackground.bind(this);
        this.initFacemeshModel = this.initFacemeshModel.bind(this);

        this.initFacemeshModel();

        this.usedServices = 0;

        this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
        this.renderer.outputEncoding = THREE.sRGBEncoding;


        // scene
        this.scene = new THREE.Scene();


        this.clock = new THREE.Clock();
        this.oldLookTarget = new THREE.Euler();

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

    initFacemeshModel() {
        this._model = new mpFacemesh.FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@` +
                    `${mpFacemesh.VERSION}/${file}`;
            }
        });
        this._model.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6
        });
    }

    setBackground(backgroundImageUrl: String) {
        const loader = new THREE.TextureLoader();
        if (backgroundImageUrl && backgroundImageUrl !== 'none')
        {
            loader.load(backgroundImageUrl, texture => {
                this.scene.background = texture;
            });
        } else {
            this.scene.background = new THREE.Color(0x6b6b6b);
        }

    }

    load3DModel(avatarModelUrl: String) {
        // need to clear sence first to prevent previous model to continue rendering
        // for a short period of time
        if (this.scene) {
            this.scene.clear();
        }

        const loader = new GLTFLoader();
        loader.crossOrigin = "anonymous";
        // Import model from URL, add your own model here
        loader.load(
            avatarModelUrl,
            gltf => {
                // debugger;
                // FIXME: somehow we need to also clear to make sure all previous sence are cleared
                if (this.scene) {
                    this.scene.clear();
                }

                this.gltf = gltf;
                this.scene.add(this.gltf.scene);

                // light
                // https://stackoverflow.com/questions/70042910/lighting-glb-models-in-three-js-with-minimal-shadows
                const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
                this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment()).texture;

                this.leftEye = this.gltf.scene.getObjectByName("LeftEye");
                this.rightEye = this.gltf.scene.getObjectByName("RightEye");
                this.headMesh = this.gltf.scene.getObjectByName("Wolf3D_Head");
                // this.headMesh = this.gltf.scene.getObjectByName("Wolf3D_Avatar");

            },

            progress => {
                if (progress.loaded == progress.total)
                    console.log("Model loaded!")
            },

            error => console.error(error)
        );
    }

    /**
     * Loop function to render the background mask.
     *
     * @private
     * @returns {void}
     */
    async _inferenceLoop() {
        if (this.usedServices > 0 && this._inputVideoElement.readyState >= 2) {
            await this._model.send({ image: this._inputVideoElement });
        }

        this._maskFrameTimerWorker.postMessage({
            id: SET_TIMEOUT,
            timeMs: 1000 / 40
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
        this.animate3DModel(results);
        this.animate();
    }

    rigRotation(
        part,
        rotation = { x: 0, y: 0, z: 0 },
        dampener = 1,
        lerpAmount = 0.3
    ) {
        if (!this.gltf) { return }

        let euler = new THREE.Euler(
            rotation.x * dampener,
            rotation.y * dampener,
            rotation.z * dampener
        );
        let quaternion = new THREE.Quaternion().setFromEuler(euler);
        part.quaternion.slerp(quaternion, lerpAmount); // interpolate
    };

    rigFace(riggedFace){
        if (!this.gltf) { return }

        const lerp = Vector.lerp;

        const mti = this.headMesh.morphTargetInfluences;
        const mtd = this.headMesh.morphTargetDictionary;

        const headRot = {
            x: -riggedFace.head.x,
            y: riggedFace.head.y,
            z: -riggedFace.head.z
        };

        this.rigRotation(this.gltf.scene.getObjectByName("Head"), headRot, 0.5);
        this.rigRotation(this.gltf.scene.getObjectByName("Neck"), headRot, 0.25);
        this.rigRotation(this.gltf.scene.getObjectByName("Spine2"), headRot, 0.20);


        riggedFace.eye.r = lerp(1 - riggedFace.eye.r, mti[mtd.eyeBlinkRight], .5)
        riggedFace.eye.l = lerp(1 - riggedFace.eye.l, mti[mtd.eyeBlinkLeft], .5)
        // riggedFace.eye = Face.stabilizeBlink(riggedFace.eye, riggedFace.head.y)
        mti[mtd.eyeBlinkRight] = riggedFace.eye.r;
        mti[mtd.eyeBlinkLeft] = riggedFace.eye.l;

        // Interpolate and set mouth blendshapes
        mti[mtd.viseme_aa] = lerp(mti[mtd.viseme_aa], riggedFace.mouth.shape.A/2, 0.5);
        mti[mtd.viseme_I] = lerp(mti[mtd.viseme_I], riggedFace.mouth.shape.I, 0.5);
        mti[mtd.viseme_E] = lerp(mti[mtd.viseme_E], riggedFace.mouth.shape.E, 0.5);
        mti[mtd.viseme_O] = lerp(mti[mtd.viseme_O], riggedFace.mouth.shape.O, 0.5);
        mti[mtd.viseme_U] = lerp(mti[mtd.viseme_U], riggedFace.mouth.shape.U, 0.5);
        mti[mtd.mouthSmile] = lerp(mti[mtd.mouthSmile], riggedFace.mouth.shape.Joy + 0.05, 0.5);


        //PUPILS
        //interpolate pupil and keep a copy of the value
        // x: lookdown, y: lookleft, z: rotate
        let lookTarget =
            new THREE.Euler(
                lerp(this.oldLookTarget.x, -Math.atan(riggedFace.pupil.y) / 4, .3),
                lerp(this.oldLookTarget.y, Math.atan(riggedFace.pupil.x) / 4, .3),
                0,
                "XYZ"
            )
        this.oldLookTarget.copy(lookTarget);
        this.leftEye.setRotationFromEuler(lookTarget);
        this.rightEye.setRotationFromEuler(lookTarget);
    }

    animate3DModel(results){
        if (!this.gltf) {
            return;
        }
        // Take the results from `Holistic` and animate character based on its Face, Pose, and Hand Keypoints.
        let riggedFace;
        const faceLandmarks = results.multiFaceLandmarks[0];
        // Animate Face
        if (faceLandmarks) {
            riggedFace = Face.solve(faceLandmarks, {
                runtime: "mediapipe",
                smoothBlink: true,
                video: this._inputVideoElement
            });
            this.rigFace(riggedFace)
        }
    }

    animate() {
        this.renderer.render(this.scene, this.orbitCamera);
    }


    /**
     * Starts loop to capture video frame and render the segmentation mask.
     *
     * @param {MediaStream} stream - Stream to be used for processing.
     * @returns {MediaStream} - The stream with the applied effect.
     */
    startEffect(stream: MediaStream) {
        const width = 1280;
        const height = 720;
        const frameRate = 25;

        this.usedServices += 1;

        // FIXME: when preview dialog is cancel, the stream is disposed, but no new stream is applied.
        // therefore bellow is a hacky way that get and use the original stream instead of the stream
        // provided with startEffect.
        const tracks = APP.store.getState()['features/base/tracks'];
        const localVideoStream = getLocalVideoTrack(tracks)?.jitsiTrack?._originalStream;
        const inputStream = localVideoStream? localVideoStream : stream;

        if (! this._stream) {
            this._stream = inputStream;

            this._maskFrameTimerWorker = new Worker(timerWorkerScript, { name: 'virtual avatar effect worker' });
            this._maskFrameTimerWorker.onmessage = this._onMaskFrameTimer;
            this._maskFrameTimerWorker.postMessage({
                id: SET_TIMEOUT,
                timeMs: 1000 / 40
            });

            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(window.devicePixelRatio);

            // camera
            this.orbitCamera = new THREE.PerspectiveCamera(35);
            this.orbitCamera.aspect = width/height;
            this.orbitCamera.updateProjectionMatrix();
            this.orbitCamera.position.set(0.0, 1.65, 1);

            this._inputVideoElement = document.createElement('video');
            this._inputVideoElement.width = width / 2;
            this._inputVideoElement.height = height / 2;
            this._inputVideoElement.autoplay = true;
            this._inputVideoElement.srcObject = this._stream;

            this.outputStream = this.renderer.domElement.captureStream(frameRate);

        } else if (this._stream !== inputStream) {
            this._stream = inputStream;
            this._inputVideoElement.srcObject = this._stream;
            this._inputVideoElement.load();
        }

        return this.outputStream;
    }

    /**
     * Stops the capture and render loop.
     *
     * @returns {void}
     */
    stopEffect() {
        this.usedServices -= 1;
    }

    _flipLocalVideo() {
        const { localFlipX: currentFlipX } = APP.store.getState()['features/base/settings'];
        APP.store.dispatch(updateSettings({ localFlipX: !currentFlipX }));
    }
}
