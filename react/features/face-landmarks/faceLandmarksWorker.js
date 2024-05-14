import { HumanHelper } from './FaceLandmarksHelper';
import { DETECT_FACE, INIT_WORKER } from './constants';

let helper;

onmessage = async function({ data }) {
    switch (data.type) {
    case DETECT_FACE: {
        if (!helper || helper.getDetectionInProgress()) {
            return;
        }

        const detections = await helper.detect(data);

        if (detections) {
            self.postMessage(detections);
        }
        break;
    }

    case INIT_WORKER: {
        helper = new HumanHelper(data);
        break;
    }
    }
};
