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
import { VRM, VRMUtils, VRMSchema } from "@pixiv/three-vrm";
import { updateSettings } from '../../base/settings';
import { getLocalVideoTrack } from '../../base/tracks';

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
    _outputCanvasElement: HTMLCanvasElement;
    _outputCanvasCtx: Object;
    _onMaskFrameTimer: Function;
    _maskFrameTimerWorker: Worker;
    _onResults: Function;
    _drawMeshOverlay: Function;
    isEnabled: Function;
    startEffect: Function;
    stopEffect: Function;
    currentVrm: Object;
    renderer: Object;
    orbitCamera: Object;
    scene: Object;
    light: Object;
    clock: Object;
    animate: Function;
    rigRotation: Function;
    rigPosition: Function;
    rigFace: Function;
    rigPose: Function;
    rigLeftHand: Function;
    rigRightHand: Function;
    oldLookTarget: Object;
    animateVRM: Function;
    loadVRM: Function;
    // count the number of services currently access the singleton object
    // (e.g., preview and real virtual avatar)
    usedServices: Number;
    initHolisticModel: Function;
    initFacemeshModel: Function;
    isFacemesh: Boolean;
    FaceMorphTargetNames: Array;
    outputStream: Object;

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
        this._drawMeshOverlay = this._drawMeshOverlay.bind(this);
        this.animate = this.animate.bind(this);
        this.rigRotation = this.rigRotation.bind(this);
        this.rigPosition = this.rigPosition.bind(this);
        this.rigFace = this.rigFace.bind(this);
        this.rigPose = this.rigPose.bind(this);
        this.rigRightHand = this.rigRightHand.bind(this);
        this.rigLeftHand = this.rigLeftHand.bind(this);
        this.animateVRM = this.animateVRM.bind(this);
        this.loadVRM = this.loadVRM.bind(this);
        this.initHolisticModel = this.initHolisticModel.bind(this);
        this.initFacemeshModel = this.initFacemeshModel.bind(this);

        // this.initHolisticModel();
        this.initFacemeshModel();

        this.usedServices = 0;

        this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });

        // scene
        this.scene = new THREE.Scene();
        // light
        this.light = new THREE.DirectionalLight(0xffffff);
        this.light.position.set(1.0, 1.0, 1.0).normalize();


        this.clock = new THREE.Clock();
        this.oldLookTarget = new THREE.Euler();

        this._outputCanvasElement = document.createElement('canvas');
        this._outputCanvasElement.getContext('2d');
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

    initHolisticModel() {
        this.isFacemesh = false;
        const config = {
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@` +
                    `${mpHolistic.VERSION}/${file}`;
            }
        };

        this._model = new mpHolistic.Holistic(config);

        this._model.setOptions({
            modelComplexity: 0,
            smoothLandmarks: true,
            // enableSegmentation: false,
            refineFaceLandmarks: true,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6
        });

    }

    initFacemeshModel() {
        this.isFacemesh = true;
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

    loadVRM(avatarModelUrl: String) {
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
                VRMUtils.removeUnnecessaryJoints(gltf.scene);
                VRMUtils.removeUnnecessaryVertices(gltf.scene);


                VRM.from(gltf).then(vrm => {
                    // FIXME: somehow we need to also clear to make sure all previous sence are cleared
                    if (this.scene) {
                        this.scene.clear();
                    }
                    this.scene.add(this.light);
                    this.currentVrm = vrm;
                    this.scene.add(this.currentVrm.scene);
                    this.currentVrm.scene.rotation.y = Math.PI; // Rotate model 180deg to face camera

                    this.FaceMorphTargetNames = this.scene.getObjectByName("Facebaked").geometry.userData.targetNames;
                });
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
        this._drawMeshOverlay(results);
        this.animateVRM(results);
        this.animate();
    }

    rigRotation(
        name,
        rotation = { x: 0, y: 0, z: 0 },
        dampener = 1,
        lerpAmount = 0.3
    ) {
        if (!this.currentVrm) { return }
        const Part = this.currentVrm.humanoid.getBoneNode(
            VRMSchema.HumanoidBoneName[name]
        );
        if (!Part) { return }

        let euler = new THREE.Euler(
            rotation.x * dampener,
            rotation.y * dampener,
            rotation.z * dampener
        );
        let quaternion = new THREE.Quaternion().setFromEuler(euler);
        Part.quaternion.slerp(quaternion, lerpAmount); // interpolate
    };

    // Animate Position Helper Function
    rigPosition(
        name,
        position = { x: 0, y: 0, z: 0 },
        dampener = 1,
        lerpAmount = 0.3
    ) {
        if (!this.currentVrm) { return }
        const Part = this.currentVrm.humanoid.getBoneNode(
            VRMSchema.HumanoidBoneName[name]
        );
        if (!Part) { return }
        let vector = new THREE.Vector3(
            position.x * dampener,
            position.y * dampener,
            position.z * dampener
        );
        Part.position.lerp(vector, lerpAmount); // interpolate
    };

    rigFace(riggedFace){
        if (!this.currentVrm) { return }
        // console.log(riggedFace.mouth);

        // debugger;

        const lerp = Vector.lerp;

        const headMirror = {
            x: riggedFace.head.x,
            y: -riggedFace.head.y,
            z: -riggedFace.head.z,
        }

        this.rigRotation("Neck", headMirror, 0.7);
        // console.log(headMirror);

        if (this.isFacemesh === true) {
            this.rigRotation("Chest", headMirror, 0.15, .3);
            this.rigRotation("Spine", headMirror, 0.25, .3);
        }

        // Blendshapes and Preset Name Schema
        const Blendshape = this.currentVrm.blendShapeProxy;
        // debugger;
        const PresetName = VRMSchema.BlendShapePresetName;

        // Simple example without winking. Interpolate based on old blendshape, then stabilize blink with `Kalidokit` helper function.
        // for VRM, 1 is closed, 0 is open.
        riggedFace.eye.l = lerp(1 - riggedFace.eye.l, Blendshape.getValue(PresetName.BlinkR), .5)
        riggedFace.eye.r = lerp(1 - riggedFace.eye.r, Blendshape.getValue(PresetName.BlinkL), .5)
        riggedFace.eye = Face.stabilizeBlink(riggedFace.eye, riggedFace.head.y)
        Blendshape.setValue(PresetName.BlinkR, riggedFace.eye.l);
        Blendshape.setValue(PresetName.BlinkL, riggedFace.eye.r);

        // Interpolate and set mouth blendshapes
        Blendshape.setValue(PresetName.I, lerp(riggedFace.mouth.shape.I, Blendshape.getValue(PresetName.I), .5));
        Blendshape.setValue(PresetName.A, lerp(riggedFace.mouth.shape.A, Blendshape.getValue(PresetName.A), .5));
        Blendshape.setValue(PresetName.E, lerp(riggedFace.mouth.shape.E, Blendshape.getValue(PresetName.E), .5));
        Blendshape.setValue(PresetName.O, lerp(riggedFace.mouth.shape.O, Blendshape.getValue(PresetName.O), .5));
        Blendshape.setValue(PresetName.U, lerp(riggedFace.mouth.shape.U, Blendshape.getValue(PresetName.U), .5));

        Blendshape.setValue(PresetName.Joy, lerp(riggedFace.mouth.shape.Joy, Blendshape.getValue(PresetName.Joy), .5));



        //PUPILS
        //interpolate pupil and keep a copy of the value
        let lookTarget =
            new THREE.Euler(
                lerp(this.oldLookTarget.x, riggedFace.pupil.y, .4),
                lerp(this.oldLookTarget.y, -riggedFace.pupil.x, .4),
                0,
                "XYZ"
            )
        this.oldLookTarget.copy(lookTarget);
        this.currentVrm.lookAt.applyer.lookAt(lookTarget);
    }

    rigPose(riggedPose){
        this.rigRotation("Hips", riggedPose.Hips.rotation, 0.7);
        this.rigPosition(
            "Hips",
            {
                // x: -riggedPose.Hips.position.x, // Reverse direction
                x: -riggedPose.Hips.position.x, // Reverse direction
                y: riggedPose.Hips.position.y + 1, // Add a bit of height
                z: -riggedPose.Hips.position.z * 2 // Reverse direction, make it more sensitive to Z distance
            },
            1,
            0.1
        );

        this.rigRotation("Chest", riggedPose.Spine, 0.25, .3);
        this.rigRotation("Spine", riggedPose.Spine, 0.45, .3);

        this.rigRotation("RightUpperArm", riggedPose.RightUpperArm, 1, .3);
        this.rigRotation("RightLowerArm", riggedPose.RightLowerArm, 1, .3);
        this.rigRotation("LeftUpperArm", riggedPose.LeftUpperArm, 1, .3);
        this.rigRotation("LeftLowerArm", riggedPose.LeftLowerArm, 1, .3);
        // this.rigRotation("LeftLowerArm", {
        //     z: riggedPose.LeftLowerArm.z,
        //     y: riggedPose.LeftLowerArm.y,
        //     x: riggedPose.LeftLowerArm.x,
        //     // x: riggedLeftHand?.LeftWrist?.z || 0,
        //     // z: riggedPose.LeftLowerArm.z
        // }, 1, .3);

        this.rigRotation("LeftUpperLeg", riggedPose.LeftUpperLeg, 1, .3);
        this.rigRotation("LeftLowerLeg", riggedPose.LeftLowerLeg, 1, .3);
        this.rigRotation("RightUpperLeg", riggedPose.RightUpperLeg, 1, .3);
        this.rigRotation("RightLowerLeg", riggedPose.RightLowerLeg, 1, .3);
    }

    rigLeftHand(riggedLeftHand, rotation){
        let z = Math.PI - (riggedLeftHand.LeftWrist.z + 1.4);
        console.log(z, riggedLeftHand.LeftWrist);
        this.rigRotation("LeftHand", {
            // Combine pose rotation Z and hand rotation X Y
            z: rotation,
            y: riggedLeftHand.LeftWrist.y,
            x: z,
            // y: 0,
            // x: (Math.round(Date.now() / 1000) % 2) * Math.PI,
            // z: 0,
            // y: 0,
            // x: -1
        });
        this.rigRotation("LeftRingProximal", riggedLeftHand.LeftRingProximal);
        this.rigRotation("LeftRingIntermediate", riggedLeftHand.LeftRingIntermediate);
        this.rigRotation("LeftRingDistal", riggedLeftHand.LeftRingDistal);
        this.rigRotation("LeftIndexProximal", riggedLeftHand.LeftIndexProximal);
        this.rigRotation("LeftIndexIntermediate", riggedLeftHand.LeftIndexIntermediate);
        this.rigRotation("LeftIndexDistal", riggedLeftHand.LeftIndexDistal);
        this.rigRotation("LeftMiddleProximal", riggedLeftHand.LeftMiddleProximal);
        this.rigRotation("LeftMiddleIntermediate", riggedLeftHand.LeftMiddleIntermediate);
        this.rigRotation("LeftMiddleDistal", riggedLeftHand.LeftMiddleDistal);
        this.rigRotation("LeftThumbProximal", riggedLeftHand.LeftThumbProximal);
        this.rigRotation("LeftThumbIntermediate", riggedLeftHand.LeftThumbIntermediate);
        this.rigRotation("LeftThumbDistal", riggedLeftHand.LeftThumbDistal);
        this.rigRotation("LeftLittleProximal", riggedLeftHand.LeftLittleProximal);
        this.rigRotation("LeftLittleIntermediate", riggedLeftHand.LeftLittleIntermediate);
        this.rigRotation("LeftLittleDistal", riggedLeftHand.LeftLittleDistal);
    }

    rigRightHand(riggedRightHand, rotation) {
        let z = (riggedRightHand.RightWrist.z + 1.4);
        console.log(z, riggedRightHand.RightWrist);
        this.rigRotation("RightHand", {
            // Combine Z axis from pose hand and X/Y axis from hand wrist rotation
            z: rotation,
            y: riggedRightHand.RightWrist.y,
            x: z
        });

        this.rigRotation("RightRingProximal", riggedRightHand.RightRingProximal);
        this.rigRotation("RightRingIntermediate", riggedRightHand.RightRingIntermediate);
        this.rigRotation("RightRingDistal", riggedRightHand.RightRingDistal);
        this.rigRotation("RightIndexProximal", riggedRightHand.RightIndexProximal);
        this.rigRotation("RightIndexIntermediate", riggedRightHand.RightIndexIntermediate);
        this.rigRotation("RightIndexDistal", riggedRightHand.RightIndexDistal);
        this.rigRotation("RightMiddleProximal", riggedRightHand.RightMiddleProximal);
        this.rigRotation("RightMiddleIntermediate", riggedRightHand.RightMiddleIntermediate);
        this.rigRotation("RightMiddleDistal", riggedRightHand.RightMiddleDistal);
        this.rigRotation("RightThumbProximal", riggedRightHand.RightThumbProximal);
        this.rigRotation("RightThumbIntermediate", riggedRightHand.RightThumbIntermediate);
        this.rigRotation("RightThumbDistal", riggedRightHand.RightThumbDistal);
        this.rigRotation("RightLittleProximal", riggedRightHand.RightLittleProximal);
        this.rigRotation("RightLittleIntermediate", riggedRightHand.RightLittleIntermediate);
        this.rigRotation("RightLittleDistal", riggedRightHand.RightLittleDistal);
    }

    animateVRM(results){
        if (!this.currentVrm) {
            return;
        }
        // Take the results from `Holistic` and animate character based on its Face, Pose, and Hand Keypoints.
        let riggedPose, riggedLeftHand, riggedRightHand, riggedFace;

        const faceLandmarks = (this.isFacemesh === false) ? results.faceLandmarks : results.multiFaceLandmarks[0];

        // Pose 3D Landmarks are with respect to Hip distance in meters
        const pose3DLandmarks = results.ea;
        // Pose 2D landmarks are with respect to videoWidth and videoHeight
        const pose2DLandmarks = results.poseLandmarks;
        // Be careful, hand landmarks may be reversed
        const leftHandLandmarks = results.rightHandLandmarks;
        const rightHandLandmarks = results.leftHandLandmarks;

        // Animate Face
        if (faceLandmarks) {
            riggedFace = Face.solve(faceLandmarks, {
                runtime: "mediapipe",
                smoothBlink: true,
                video: this._inputVideoElement
            });
            this.rigFace(riggedFace)
        }

        // from T-pose to natural rest pose
        if (this.isFacemesh === true) {
            this.rigRotation("RightUpperArm", { z: -1.4, y: 0, x: 0 });
            this.rigRotation("LeftUpperArm", { z: 1.4, y: 0, x: 0 });
            this.rigRotation("RightLowerArm", { z: -0.5, y: 0, x: 0 });
            this.rigRotation("LeftLowerArm", { z: 0.5, y: 0, x: 0 });

            this.rigPosition( "Chest", { z: 0, y: 0, x: 0 });
        }

        if (pose2DLandmarks && pose3DLandmarks) {
            riggedPose = Pose.solve(pose3DLandmarks, pose2DLandmarks, {
                runtime: "mediapipe",
                video: this._inputVideoElement,
            });
            this.rigPose(riggedPose)
        }

        if (leftHandLandmarks) {
            riggedLeftHand = Hand.solve(leftHandLandmarks, "Left");
            this.rigLeftHand(riggedLeftHand, riggedPose.LeftHand.z);
        }

        if (rightHandLandmarks) {
            riggedRightHand = Hand.solve(rightHandLandmarks, "Right");
            this.rigRightHand(riggedRightHand, riggedPose.RightHand.z);
        }
    }

    animate() {
        if (this.currentVrm) {
            // Update model to render physics
            this.currentVrm.update(this.clock.getDelta());
        }
        this.renderer.render(this.scene, this.orbitCamera);
        // console.log(this.currentVrm, "animating...");
    }

    _drawMeshOverlay(results) {
        // debugger;
        this._outputCanvasCtx.save();
        this._outputCanvasCtx.clearRect(0, 0, this._outputCanvasElement.width, this._outputCanvasElement.height);
        // Use `Mediapipe` drawing functions
        drawingUtils.drawConnectors(this._outputCanvasCtx, results.poseLandmarks, mpHolistic.POSE_CONNECTIONS, {
            color: "#00cff7",
            lineWidth: 4
        });
        drawingUtils.drawLandmarks(this._outputCanvasCtx, results.poseLandmarks, {
            color: "#ff0364",
            lineWidth: 2
        });

        const faceLandmarks = (this.isFacemesh === false) ? results.faceLandmarks : results.multiFaceLandmarks[0];

        drawingUtils.drawConnectors(this._outputCanvasCtx, faceLandmarks, mpHolistic.FACEMESH_TESSELATION, {
            color: "#C0C0C070",
            lineWidth: 1,
        });
        if (faceLandmarks && faceLandmarks.length === 478) {
            //draw pupils
            drawingUtils.drawLandmarks(this._outputCanvasCtx, [faceLandmarks[468], faceLandmarks[468 + 5]], {
                color: "#ffe603",
                lineWidth: 2
            });
        }
        drawingUtils.drawConnectors(this._outputCanvasCtx, results.leftHandLandmarks, mpHolistic.HAND_CONNECTIONS, {
            color: "#eb1064",
            lineWidth: 5
        });
        drawingUtils.drawLandmarks(this._outputCanvasCtx, results.leftHandLandmarks, {
            color: "#00cff7",
            lineWidth: 2
        });
        drawingUtils.drawConnectors(this._outputCanvasCtx, results.rightHandLandmarks, mpHolistic.HAND_CONNECTIONS, {
            color: "#22c3e3",
            lineWidth: 5
        });
        drawingUtils.drawLandmarks(this._outputCanvasCtx, results.rightHandLandmarks, {
            color: "#ff0364",
            lineWidth: 2
        });
        this._outputCanvasCtx.restore();
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

        if (! this._stream) {
            this._stream = stream;

            this._maskFrameTimerWorker = new Worker(timerWorkerScript, { name: 'virtual avatar effect worker' });
            this._maskFrameTimerWorker.onmessage = this._onMaskFrameTimer;
            this._maskFrameTimerWorker.postMessage({
                id: SET_TIMEOUT,
                timeMs: 1000 / 40
            });

            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(window.devicePixelRatio);

            // camera
            this.orbitCamera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
            // this.orbitCamera.position.set(0.0, 1.5, 1);
            this.orbitCamera.position.set(0.0, 1, 1);

            this._outputCanvasElement.width = width;
            this._outputCanvasElement.height = height;
            this._outputCanvasCtx = this._outputCanvasElement.getContext('2d');

            this._inputVideoElement = document.createElement('video');
            this._inputVideoElement.width = width / 2;
            this._inputVideoElement.height = height / 2;
            this._inputVideoElement.autoplay = true;
            this._inputVideoElement.srcObject = this._stream;

            this.outputStream = this.renderer.domElement.captureStream(frameRate);
            // this.outputStream = this._outputCanvasElement.captureStream(frameRate);

        } else if (this._stream !== stream) {
            // this._inputVideoElement.pause();
            this._stream = stream;
            this._inputVideoElement.srcObject = this._stream;
            this._inputVideoElement.load();
            //  this._inputVideoElement.play();
        }



        return this.outputStream;
    }

    /**
     * Stops the capture and render loop.
     *
     * @returns {void}
     */
    stopEffect() {
        // this._maskFrameTimerWorker.postMessage({
        //     id: CLEAR_TIMEOUT
        // });

        // this._maskFrameTimerWorker.terminate();
        this.usedServices -= 1;
    }

    _flipLocalVideo() {
        const { localFlipX: currentFlipX } = APP.store.getState()['features/base/settings'];
        APP.store.dispatch(updateSettings({ localFlipX: !currentFlipX }));
    }
}
