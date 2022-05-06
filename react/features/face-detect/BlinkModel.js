import * as tf from '@tensorflow/tfjs';

export default class BlinkEstimatorTensorflow {
    constructor(threshold) {
        this.threshold = threshold;
    }

    async predict(left_eyes, right_eyes) {
        if (!this.model) {
            this.model = await tf.loadLayersModel('/libs/blink/model.json');
        }

        // model expects this order!
        const x = [right_eyes, left_eyes];
        const p = this.model.predict(x);
        return p;
    }
}

