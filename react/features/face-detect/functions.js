// @flow

import FaceDetectEffect from './RetinaFaceEffect';

/**
 * Start face detect process.
 *
 * @param {Object} arObj - AR image link
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {Promise<JitsiStreamBackgroundEffect>}
 */
export async function startFaceDetect(stream: MediaStream) {
    let tflite;
    let wasmCheck;

    // Checks if WebAssembly feature is supported or enabled by/in the browser.
    // Conditional import of wasm-check package is done to prevent
    // the browser from crashing when the user opens the app.

    try {
        wasmCheck = require('wasm-check');
        const tfliteTimeout = 10000;

        if (wasmCheck?.feature?.simd) {
            tflite = await timeout(tfliteTimeout, createTFLiteSIMDModule());
        } else {
            tflite = await timeout(tfliteTimeout, createTFLiteModule());
        }
    } catch (err) {
        if (err?.message === '408') {
            logger.error('Failed to download tflite model!');
            dispatch(showWarningNotification({
                titleKey: 'virtualBackground.backgroundEffectError'
            }));
        } else {
            logger.error('Looks like WebAssembly is disabled or not supported on this browser');
            dispatch(showWarningNotification({
                titleKey: 'virtualBackground.webAssemblyWarning',
                description: 'WebAssembly disabled or not supported by this browser'
            }));
        }

        return;

    }

    const modelBufferOffset = tflite._getModelBufferMemoryOffset();
    const modelResponse = await fetch(wasmCheck.feature.simd ? models.model144 : models.model96);

    if (!modelResponse.ok) {
        throw new Error('Failed to download tflite model!');
    }

    const model = await modelResponse.arrayBuffer();

    tflite.HEAPU8.set(new Uint8Array(model), modelBufferOffset);

    tflite._loadModel(model.byteLength);

    const options = {
        ...wasmCheck.feature.simd ? segmentationDimensions.model144 : segmentationDimensions.model96,
        virtualBackground
    };
}

export function stopFaceDetect() {
    
}
