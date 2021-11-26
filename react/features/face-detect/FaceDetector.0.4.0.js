/* FaceDetector for worker */

import * as tf from '@tensorflow/tfjs';
import { findIndex, isEqual, map, max, zipObject } from 'lodash';

import { anchors_plane, argsort, bbox_pred, generate_anchors_fpn, getReferenceData, inferenceFrame, normalize_frame, preprocess_image } from './utils/utils';

export default class FaceDetector {
    constructor(model) {
        this.model = model;
    }

    prepare(nms = 0.4) {
        this.nms_threshold = nms;
        this.landmark_std = tf.scalar(0.2);
        
        const _ratio = [1.0];
    
        this._feat_stride_fpn = [32, 16, 8];
        this.anchor_cfg = {
          '32': {'SCALES': [32,16], 'BASE_SIZE': 16, 'RATIOS': _ratio, 'ALLOWED_BORDER': 9999},
          '16': {'SCALES': [8,4], 'BASE_SIZE': 16, 'RATIOS': _ratio, 'ALLOWED_BORDER': 9999},
          '8': {'SCALES': [2,1], 'BASE_SIZE': 16, 'RATIOS': _ratio, 'ALLOWED_BORDER': 9999},
        };
    
        this.use_landmarks = true;
        this.fpn_keys = map(this._feat_stride_fpn, v => `stride${v}`);
    
        this._anchors_fpn = zipObject(this.fpn_keys, generate_anchors_fpn(this.anchor_cfg));
        this.anchor_plane_cache = {}
        this._num_anchors = zipObject(this.fpn_keys, map(this._anchors_fpn, t => t.shape[0]));
    }

    detect(frame, threshold=0.5, scale=1.0) {
        const proposals_list = [];
        const scores_list = [];
        const landmarks_list = [];
    
        const [im_tensor, im_info, im_scale] = preprocess_image(frame);
        // im_tensor = cv2.resize(im_tensor.squeeze(), (640, 640))
    
        // # im_tensor = np.expand_dims(np.transpose(im_tensor, (2, 0, 1)),axis=0).astype(np.float32)
        // im_tensor = np.transpose(im_tensor, (2, 0, 1)).astype(np.float32)
        // input_name = self.model.get_inputs()[0].name
        const frameNormed = normalize_frame(im_tensor);
    
        // # out = self.model({tf.convert_to_tensor(im_tensor)})
        // #
        // # out_val=list(out.values())
        // # net_out=[out.numpy() for out in out_val]
        // # net_out=[]
        // # for idx in [4, 1, 7, 3, 0, 6, 5, 2, 8]:
        // #     net_out.append(out_val[idx].numpy())
    
        // net_out = []
        // for output in self.model.get_outputs()[:]:
        //     net_output = self.model.run([output.name], {"data": [im_tensor]})[0]
        //     net_out.append(net_output)
        const net_out = model.predict(frameNormed);
        console.log('detect output:', net_out);
    
        this._feat_stride_fpn.forEach((s, _idx) => {
            const _key = `stride${s}`;
            const stride = s;
            let idx = this.use_landmarks ? _idx * 3 : _idx * 2;

            let scores = net_out[idx];
            scores = scores.gather(tf.tensor1d(this._num_anchors[_key], 'int32'), 1);
            idx += 1;
            let bbox_deltas = net_out[idx];
    
            const [height, width] = bbox_deltas.shape.slice(2,4);
            const A = this._num_anchors[_key];
            const K = height * width;
            const key = [height, width, stride];
            let anchors;

            if (key in this.anchor_plane_cache) {
                anchors = this.anchor_plane_cache[key];
            } else {
                const anchors_fpn = this._anchors_fpn[key];
                anchors = anchors_plane(height, width, stride, anchors_fpn);
                anchors = anchors.reshape([K * A, 4]);
                if (len(this.anchor_plane_cache) < 100) {
                    this.anchor_plane_cache[key] = anchors;
                }
            }
    
            scores = clip_pad(scores, [height, width]);
            scores = scores.transpose((0, 2, 3, 1)).reshape([-1, 1]);
            // # scores = tf.reshape(tf.transpose(scores, (0, 2, 3, 1)), (-1, 1))
    
            bbox_deltas = clip_pad(bbox_deltas, [height, width]);
            bbox_deltas = bbox_deltas.transpose([0, 2, 3, 1]);
            // # bbox_deltas = tf.transpose(bbox_deltas,(0, 2, 3, 1))
    
            const bbox_pred_len = bbox_deltas.shape[3]; //A
    
            bbox_deltas = bbox_deltas.reshape([-1, bbox_pred_len]);
            // # bbox_deltas = tf.reshape(bbox_deltas, (-1, bbox_pred_len))
    
            let proposals = bbox_pred(anchors, bbox_deltas);
    
    
            const scores_ravel = flattenDeep(scores.arraySync());
            const order = findIndex(scores_ravel, s => s >= threshold);
            scores = scores[order]
            proposals = proposals.gather(tf.tensor1d(order, 'int32'), 0);
    
            // proposals[:,0:4] /= scale
            const ps = tf.split(proposals, 4, 1);
            ps.forEach((p, i) => {
                ps[i] = p.div(tf.scalar(scale));
            });
            proposals = tf.concat(ps, 1);
    
            proposals_list.push(proposals);
            scores_list.push(scores);
    
            if (this.use_landmarks) {
                idx += 1;
                let landmark_deltas = net_out[idx];
                landmark_deltas = clip_pad(landmark_deltas, [height, width]);
                const landmark_pred_len = landmark_deltas.shape[1];   //A
                landmark_deltas = landmark_deltas.transpose([0, 2, 3, 1]).reshape([-1, 5, Math.floor(landmark_pred_len/5)]);
                // # landmark_deltas = tf.reshape(tf.transpose(landmark_deltas,(0, 2, 3, 1)), (-1, 5, landmark_pred_len//5))
    
                landmark_deltas = landmark_deltas.mul(this.landmark_std);
                let landmarks = landmark_pred(anchors, landmark_deltas);
                landmarks = landmarks.gather(tf.tensor1d(order, 'int32'), 0);
    
                // landmarks[:,:,0:2] /= scale
                landmarks = tf
                    .slice(landmarks, [0,0,0], [landmarks.shape[0], landmarks.shape[1], 2])
                    .div(tf.scalar(scale));
                landmarks_list.push(landmarks);
            }
        });
    
        // proposals = np.vstack(proposals_list)
        proposals = tf.concat(proposals_list, 0);
        let landmarks = null;

        if (proposals.shape[0] === 0) {
            if (this.use_landmarks) {
                landmarks = tf.zeros([0,5,2]);
            }

            return [tf.zeros([0,5]), landmarks];
        }

        // scores = np.vstack(scores_list)
        scores = tf.concat(scores_list, 0);
        scores_ravel = flattenDeep(scores.arraySync());
        // order = scores_ravel.argsort()[::-1]
        order = scores_raval.indexOf(max(scores_ravel));
        proposals = proposals.gather(tf.tensor1d(order, 'int32'), 0);
        scores = scores.gather(tf.tensor1d(order, 'int32'), 0);
        if (this.use_landmarks) {
            // landmarks = np.vstack(landmarks_list)
            // landmarks = landmarks[order].astype(np.float32, copy=False)
            landmarks = tf.concat(landmarks_list, 0).asType('float32');
        }
    
        // pre_det = np.hstack((proposals[:,0:4], scores)).astype(np.float32, copy=False)
        const pre_det = tf.concat([
            tf.slice(proposals, [0, 0], [proposals.shape[0], 4]),
            scores
        ], 1).asType('float32');
        const keep = this.nms(pre_det);
        // det = np.hstack( (pre_det, proposals[:,4:]) )
        let det = tf.concat([pre_det, tf.slice(proposals, [0, 4], [proposals.shape[0], proposals.shape[1]])], 1);
        det = det.gether(tf.tensor1d(keep, 'int32'), 0);
        if (this.use_landmarks) {
            landmarks = landmarks[keep]
        }
    
        return [det, landmarks];
    }

    nms(dets) {
        const thresh = this.nms_threshold;
        const x1 = dets.gather(0, 1);
        const y1 = dets.gather(1, 1);
        const x2 = dets.gather(2, 1);
        const y2 = dets.gather(3, 1);
        const scores = dets.gather(4, 1).arraySync();

        // areas = (x2 - x1 + 1) * (y2 - y1 + 1)
        const areas = x2.sub(x1).add(tf.scalar(1)).mul(y2.sub(y1).add(tf.scalar(1)));
        // order = scores.argsort()[::-1]
        let order = argsort(scores).reverse();

        const keep = [];
        while (order.length > 0) {
            keep.push(order[0]);
            const xx1 = tf.maximum(x1.gather(order[0]), x1.gather(order.slice(1)));
            const yy1 = tf.maximum(y1.gather(order[0]), y1.gather(order.slice(1)));
            const xx2 = tf.minimum(x2.gather(order[0]), x2.gather(order.slice(1)));
            const yy2 = tf.minimum(y2.gather(order[0]), y2.gather(order.slice(1)));

            const w = tf.maximum(tf.scalar(0.0), xx2.sub(xx1).add(tf.scalar(1)));
            const h = tf.maximum(tf.scalar(0.0), yy2.sub(yy1).add(tf.scalar(1)));
            const inter = w.mul(h);
            const ovr = inter.div(areas.gather(order).sub(inter));

            // inds = np.where(ovr <= thresh)[0]
            // const inds = ovr.where, v => v <= thresh);
            // order = order[inds + 1];
        }

        return keep
    }

}
