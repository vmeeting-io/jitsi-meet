/* FaceDetector for worker */

import * as tf from '@tensorflow/tfjs';
import { flattenDeep, map, range, size, sortBy, zipObject } from 'lodash';

import { normalize_frame } from './utils/utils';

function argsort(array) {
    const argIndices = array
        .map((value, idx) => { return { value, idx }; })
        .sort((a, b) => a.value - b.value)
        .map(data => data.idx);

    return argIndices;
}

function where(array, condition) {
    const argIndices = array.reduce((acc, v, i) => {
        if (condition(v)) acc.push(i);
        return acc;
    }, []);

    return argIndices;
}

/*
 * Return width, height, x center, and y center for an anchor (window).
 */
function _whctrs(anchor) {
    const a = anchor.squeeze().arraySync();
    // w = anchor[2] - anchor[0] + 1
    const w = a[2] - a[0] + 1;
    // h = anchor[3] - anchor[1] + 1
    const h = a[3] - a[1] + 1;
    // x_ctr = anchor[0] + 0.5 * (w - 1)
    const x_ctr = tf.scalar(a[0] + 0.5 * (w - 1));
    // y_ctr = anchor[1] + 0.5 * (h - 1)
    const y_ctr = tf.scalar(a[1] + 0.5 * (h - 1));

    return { w, h, x_ctr, y_ctr };
}

/*
 * Given a vector of widths (ws) and heights (hs) around a center
 * (x_ctr, y_ctr), output a set of anchors (windows).
 */
function _mkanchors(ws, hs, x_ctr, y_ctr) {
    const anchors = tf.tidy(() => {
        const ws1 = ws.expandDims(1);
        const hs1 = hs.expandDims(1);

        // anchors = np.hstack(...)
        return tf.concat([
            // x_ctr - 0.5 * (ws1 - 1),
            x_ctr.sub(ws1.sub(1).mul(0.5)),
            // y_ctr - 0.5 * (hs1 - 1),
            y_ctr.sub(hs1.sub(1).mul(0.5)),
            // x_ctr + 0.5 * (ws1 - 1),
            x_ctr.add(ws1.sub(1).mul(0.5)),
            // y_ctr + 0.5 * (hs1 - 1)
            y_ctr.add(hs1.sub(1).mul(0.5))
        ], 1);
    });

    return anchors;
}

/*
 * Enumerate a set of anchors for each aspect ratio wrt an anchor.
 * anchor: tensor
 * ratios: tensor
 */
function _ratio_enum(anchor, ratios) {
    const { w, h, x_ctr, y_ctr } = _whctrs(anchor);
    const size = w * h;
    const size_ratios = tf.scalar(size).div(ratios);
    const ws = tf.round(size_ratios.sqrt(size_ratios));
    const hs = tf.round(ws.mul(ratios));
    const anchors = _mkanchors(ws, hs, x_ctr, y_ctr);
    return anchors;
}

/*
 * Enumerate a set of anchors for each scale wrt an anchor.
 */
function _scale_enum(anchor, scales) {
    const { w, h, x_ctr, y_ctr } = _whctrs(anchor);
    const ws = scales.mul(tf.scalar(w));
    const hs = scales.mul(tf.scalar(h));
    const anchors = _mkanchors(ws, hs, x_ctr, y_ctr);
    return anchors;
}

/*
 * Generate anchor (reference) windows by enumerating aspect ratios X
 * scales wrt a reference (0, 0, 15, 15) window.
 */
function generate_anchors(base_size=16, ratios=tf.tensor([0.5, 1, 2]),
                     scales=tf.scalar(2).pow(range(3, 6)), stride=16)
{
    const base_anchor = tf.tensor([1, 1, base_size, base_size]).sub(tf.scalar(1));
    const ratio_anchors = _ratio_enum(base_anchor, ratios);
    // anchors = np.vstack([_scale_enum(ratio_anchors[i, :], scales)
    //                      for i in range(ratio_anchors.shape[0])])
    const anchors = range(ratio_anchors.shape[0]).map(i => {
        return _scale_enum(ratio_anchors.gather(i, 0), scales);
    });
    return tf.concat(anchors);
}

/*
 * Generate anchor (reference) windows by enumerating aspect ratios X
 * scales wrt a reference (0, 0, 15, 15) window.
 */
function generate_anchors_fpn(cfg) {
    // RPN_FEAT_STRIDE = []
    // for k in cfg:
    //   RPN_FEAT_STRIDE.append( int(k) )
    // RPN_FEAT_STRIDE = sorted(RPN_FEAT_STRIDE, reverse=True)
    const RPN_FEAT_STRIDE = Object.keys(cfg)
        .map(k => parseInt(k))
        .sort((a,b) => b - a);

    // for k in RPN_FEAT_STRIDE:
    const anchors = map(RPN_FEAT_STRIDE, k => {
        // v = cfg[str(k)]
        const v = cfg[k];
        const bs = v['BASE_SIZE'];
        // __ratios = np.array(v['RATIOS'])
        const __ratios = tf.tensor(v['RATIOS']);
        // __scales = np.array(v['SCALES'])
        const __scales = tf.tensor(v['SCALES']);
        // stride = int(k)
        // #print('anchors_fpn', bs, __ratios, __scales, file=sys.stderr)
        const r = generate_anchors(bs, __ratios, __scales, k)
        // #print('anchors_fpn', r.shape, file=sys.stderr)
        
        return r;
    });

    return anchors;
}

export function resize_image(img, scales) {
    const [img_h, img_w] = img.shape.slice(0, 2);
    const [target_size, max_size] = scales;
    let im_size_min, im_size_max;

    if (img_w > img_h) {
        im_size_min = img_h;
        im_size_max = img_w;
    } else {
        im_size_min = img_w;
        im_size_max = img_h;
    }

    let im_scale = target_size / im_size_min;
    if (im_scale * im_size_max > max_size) {
        im_scale = max_size / im_size_max;
    }

    let resized_img = img;
    if (im_scale != 1.0) {
        const target_width = img_w * im_scale;
        const target_height = img_h * im_scale;
        resized_img = tf.image.resizeBilinear(img, [target_height, target_width], true);
    }

    return [resized_img, im_scale];
}

function preprocess_image(img) {
    const pixel_means = [0.0, 0.0, 0.0];
    const pixel_stds = [1.0, 1.0, 1.0];
    const pixel_scale = 1.0;
    const scales = [1024, 1980];

    const resized_img = img.asType('float32');
    const im_scale = 1.0;

    // Make image scaling + BGR2RGB conversion + transpose (N,H,W,C) to (N,C,H,W)
    // for i in range(3):
    //     im_tensor[0, :, :, i] = (img[:, :, 2 - i] / pixel_scale - pixel_means[2 - i]) / pixel_stds[2 - i]
    let im_tensor = tf.split(resized_img, 3, 2);
    im_tensor = tf.concat([
        im_tensor[2].div(pixel_scale).sub(pixel_means[2]).div(pixel_stds[2]),
        im_tensor[1].div(pixel_scale).sub(pixel_means[1]).div(pixel_stds[1]),
        im_tensor[0].div(pixel_scale).sub(pixel_means[0]).div(pixel_stds[0]),
    ], 2);

    return [im_tensor, resized_img.shape.slice(0, 2), im_scale];
}

/*
 * Parameters
 * ----------
 * height: height of plane
 * width:  width of plane
 * stride: stride ot the original image
 * anchors_base: (A, 4) a base set of anchors
 * Returns
 * -------
 * all_anchors: (height, width, A, 4) ndarray of anchors spreading over the plane
 */
function anchors_plane(height, width, stride, base_anchors) {
    const A = base_anchors.shape[0];
    // all_anchors = np.zeros((height, width, A, 4), dtype=np.float32)
    const all_anchors = tf.buffer([height, width, A, 4]);
    const data = base_anchors.arraySync();

    for (let iw of range(width)) {
        const sw = iw * stride;
        for (let ih of range(height)) {
            const sh = ih * stride;
            for (let k of range(A)) {
                all_anchors.set(data[k][0] + sw, ih, iw, k, 0);
                all_anchors.set(data[k][1] + sh, ih, iw, k, 1);
                all_anchors.set(data[k][2] + sw, ih, iw, k, 2);
                all_anchors.set(data[k][3] + sh, ih, iw, k, 3);
            }
        }
    }

    return all_anchors.toTensor();
}

/*
 * Clip boxes of the pad area.
 * :param tensor: [n, c, H, W]
 * :param pad_shape: [h, w]
 * :return: [n, c, h, w]
 */
function clip_pad(tensor, pad_shape) {
    const [H, W] = tensor.shape.slice(2);
    const [h, w] = pad_shape;
    let clipped = tensor;

    if (h < H || w < W) {
        // tensor[:, :, :h, :w].copy()
        clipped = tensor.slice([0, 0, 0, 0], [tensor.shape[0], tensor.shape[1], h, w]);
    }

    return clipped;
}

/*
 * Transform the set of class-agnostic boxes into class-specific boxes
 * by applying the predicted offsets (box_deltas)
 * :param boxes: !important [N 4]
 * :param box_deltas: [N, 4 * num_classes]
 * :return: [N 4 * num_classes]
 */
function bbox_pred(boxes, box_deltas) {
    if (boxes.shape[0] == 0) {
        return np.zeros([0, box_deltas.shape[1]]);
    }

    const result = tf.tidy(() => {
        const fboxes = boxes.asType('float32');
        // widths = boxes[:, 2] - boxes[:, 0] + 1.0
        const widths = fboxes.gather(2, 1).sub(fboxes.gather(0, 1)).add(1.0);
        // heights = boxes[:, 3] - boxes[:, 1] + 1.0
        const heights = fboxes.gather(3, 1).sub(fboxes.gather(1, 1)).add(1.0);
        // ctr_x = boxes[:, 0] + 0.5 * (widths - 1.0)
        const ctr_x = fboxes.gather(0, 1).add(widths.sub(1.0).mul(0.5));
        // ctr_y = boxes[:, 1] + 0.5 * (heights - 1.0)
        const ctr_y = fboxes.gather(1, 1).add(heights.sub(1.0).mul(0.5));

        // dx = box_deltas[:, 0:1]
        const dx = box_deltas.gather([0], 1);
        // dy = box_deltas[:, 1:2]
        const dy = box_deltas.gather([1], 1);
        // dw = box_deltas[:, 2:3]
        const dw = box_deltas.gather([2], 1);
        // dh = box_deltas[:, 3:4]
        const dh = box_deltas.gather([3], 1);

        // pred_ctr_x = dx * widths[:, np.newaxis] + ctr_x[:, np.newaxis]
        const pred_ctr_x = dx.mul(widths.expandDims(1)).add(ctr_x.expandDims(1));
        // pred_ctr_y = dy * heights[:, np.newaxis] + ctr_y[:, np.newaxis]
        const pred_ctr_y = dy.mul(heights.expandDims(1)).add(ctr_y.expandDims(1));
        // pred_w = np.exp(dw) * widths[:, np.newaxis]
        const pred_w = dw.exp().mul(widths.expandDims(1));
        // pred_h = np.exp(dh) * heights[:, np.newaxis]
        const pred_h = dh.exp().mul(heights.expandDims(1));

        // pred_boxes = np.zeros(box_deltas.shape)
        let pred_boxes = [];
        // # x1
        // pred_boxes[:, 0:1] = pred_ctr_x - 0.5 * (pred_w - 1.0)
        pred_boxes.push(pred_ctr_x.sub(pred_w.sub(1.0).mul(0.5)));
        // # y1
        // pred_boxes[:, 1:2] = pred_ctr_y - 0.5 * (pred_h - 1.0)
        pred_boxes.push(pred_ctr_y.sub(pred_h.sub(1.0).mul(0.5)));
        // # x2
        // pred_boxes[:, 2:3] = pred_ctr_x + 0.5 * (pred_w - 1.0)
        pred_boxes.push(pred_ctr_x.add(pred_w.sub(1.0).mul(0.5)));
        // # y2
        // pred_boxes[:, 3:4] = pred_ctr_y + 0.5 * (pred_h - 1.0)
        pred_boxes.push(pred_ctr_y.add(pred_h.sub(1.0).mul(0.5)));

        pred_boxes = tf.concat(pred_boxes, 1);

        return pred_boxes;
    });

    return result;
}

function landmark_pred(boxes, landmark_deltas) {
    // console.log('landmark_pred:', boxes.shape, landmark_deltas.shape);
    if (boxes.shape[0] == 0) {
        return tf.zeros([0, landmark_deltas.shape[1]]);
    }

    const result = tf.tidy(() => {
        // widths = boxes[:, 2] - boxes[:, 0] + 1.0
        let widths = boxes.gather(2, 1).sub(boxes.gather(0, 1)).add(1.0);
        // heights = boxes[:, 3] - boxes[:, 1] + 1.0
        let heights = boxes.gather(3, 1).sub(boxes.gather(1, 1)).add(1.0);
        // ctr_x = boxes[:, 0] + 0.5 * (widths - 1.0)
        let ctr_x = boxes.gather(0, 1).add(widths.sub(1.0).mul(0.5));
        // ctr_y = boxes[:, 1] + 0.5 * (heights - 1.0)
        let ctr_y = boxes.gather(1, 1).add(heights.sub(1.0).mul(0.5));

        // for i in range(5):
        //     pred[:,i,0] = landmark_deltas[:,i,0] * widths + ctr_x
        //     pred[:,i,1] = landmark_deltas[:,i,1] * heights + ctr_y
        let pred = tf.unstack(landmark_deltas, 2);
        const shape = [landmark_deltas.shape[0], 1];
        pred[0] = pred[0].mul(widths.reshape(shape)).add(ctr_x.reshape(shape));
        pred[1] = pred[1].mul(heights.reshape(shape)).add(ctr_y.reshape(shape));
        pred = tf.stack(pred, 2);

        return pred;
    });

    return result;
}

export default class RetinaFaceModel {
    prepare(nms = 0.4) {
        this.nms_threshold = nms;
        this.landmark_std = 0.2;

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

    async detect(frame, threshold=0.5, scale=1.0) {
        if (!this.model) {
            this.model = await tf.loadGraphModel('/libs/retinaface/model.json');
        }

        const proposals_list = [];
        const scores_list = [];
        const landmarks_list = [];

        // const [im_tensor, im_info, im_scale] = preprocess_image(frame);
        // im_tensor = cv2.resize(im_tensor.squeeze(), (640, 640))

        // # im_tensor = np.expand_dims(np.transpose(im_tensor, (2, 0, 1)),axis=0).astype(np.float32)
        // im_tensor = np.transpose(im_tensor, (2, 0, 1)).astype(np.float32)
        // input_name = self.model.get_inputs()[0].name
        const frameNormed = normalize_frame(frame, 640, 640);
        // console.log('frameNormed.shape', frameNormed.shape);
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
        let outputs = [];
        let proposals = null;
        let scores = null;
        let scores_ravel = [];
        let order = [];

        const cls = ['cls_prob_reshape', 'bbox_pred', 'landmark_pred']
        for (let i = 0; i < this.model.outputs.length; i++) {
            const idx = this._feat_stride_fpn[Math.floor(i / 3)];
            outputs.push(`face_rpn_${cls[i % 3]}_stride${idx}`);
        }
        const net_out = this.model.execute(frameNormed, outputs);
        // console.log('detect output:', net_out);

        this._feat_stride_fpn.forEach((stride, _idx) => {
            const _key = `stride${stride}`;
            let idx = this.use_landmarks ? _idx * 3 : _idx * 2;

            scores = net_out[idx];
            const begin = this._num_anchors[_key];
            scores = scores.slice(
                [0, begin, 0, 0],
                [scores.shape[0], scores.shape[1] - begin, scores.shape[2], scores.shape[3]]);
            idx += 1;
            let bbox_deltas = net_out[idx];

            const [height, width] = bbox_deltas.shape.slice(2,4);
            // console.log('height=', height, ', width=', width);
            const A = this._num_anchors[_key];
            const K = height * width;
            const key = [height, width, stride];
            let anchors;

            if (key in this.anchor_plane_cache) {
                anchors = this.anchor_plane_cache[key];
            } else {
                const anchors_fpn = this._anchors_fpn[`stride${stride}`];
                anchors = anchors_plane(height, width, stride, anchors_fpn);
                anchors = anchors.reshape([K * A, 4]);
                if (size(this.anchor_plane_cache) < 100) {
                    this.anchor_plane_cache[key] = anchors;
                }
            }
    
            scores = clip_pad(scores, [height, width]);
            scores = scores.transpose([0, 2, 3, 1]).reshape([-1, 1]);
            // console.log('scores.shape=', scores.shape);
    
            bbox_deltas = clip_pad(bbox_deltas, [height, width]);
            bbox_deltas = bbox_deltas.transpose([0, 2, 3, 1]);
            // # bbox_deltas = tf.transpose(bbox_deltas,(0, 2, 3, 1))
    
            // bbox_pred_len = bbox_deltas.shape[3]//A
            const bbox_pred_len = Math.floor(bbox_deltas.shape[3] / A);
    
            bbox_deltas = bbox_deltas.reshape([-1, bbox_pred_len]);
            // # bbox_deltas = tf.reshape(bbox_deltas, (-1, bbox_pred_len))
    
            proposals = bbox_pred(anchors, bbox_deltas);

    
            scores_ravel = flattenDeep(scores.arraySync());
            // order = np.where(scores_ravel>=threshold)[0];
            order = where(scores_ravel, v => v >= threshold);
            // console.log('order:', order);

            // scores = scores[order]
            scores = scores.gather(order)
            // proposals = proposals[order, :]
            proposals = proposals.gather(order, 0);
    
            // proposals[:,0:4] /= scale
            proposals = proposals.unstack(1);
            for (let i = 0; i < 4; i++) {
                proposals[i] = proposals[i].div(scale);
            }
            proposals = tf.stack(proposals, 1);
    
            proposals_list.push(proposals);
            scores_list.push(scores);
    
            if (this.use_landmarks) {
                idx += 1;
                let landmark_deltas = net_out[idx];
                landmark_deltas = clip_pad(landmark_deltas, [height, width]);
                // landmark_pred_len = landmark_deltas.shape[1]//A
                const landmark_pred_len = Math.floor(landmark_deltas.shape[1]/A);
                landmark_deltas = landmark_deltas.transpose([0, 2, 3, 1]).reshape([-1, 5, Math.floor(landmark_pred_len/5)]);
                // # landmark_deltas = tf.reshape(tf.transpose(landmark_deltas,(0, 2, 3, 1)), (-1, 5, landmark_pred_len//5))
    
                landmark_deltas = landmark_deltas.mul(this.landmark_std);
                let landmarks = landmark_pred(anchors, landmark_deltas);
                landmarks = landmarks.gather(order, 0);

                // landmarks[:,:,0:2] /= scale
                landmarks = landmarks.unstack(2);
                for (let i = 0; i < 2; i += 1) {
                    landmarks[i] = landmarks[i].div(scale);
                }
                landmarks = tf.stack(landmarks, 2);
                landmarks_list.push(landmarks);
            }
        });

        // proposals = np.vstack(proposals_list)
        proposals = tf.concat(proposals_list, 0);
        // proposals.print();

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
        order = argsort(scores_ravel).reverse();
        // proposals = proposals[order, :]
        proposals = proposals.gather(order, 0);
        // scores = scores[order]
        scores = scores.gather(order);
        if (this.use_landmarks) {
            // landmarks = np.vstack(landmarks_list)
            // landmarks = landmarks[order].astype(np.float32, copy=False)
            landmarks = tf.concat(landmarks_list, 0)
                .gather(order)
                .asType('float32');
        }

        // pre_det = np.hstack((proposals[:,0:4], scores)).astype(np.float32, copy=False)
        const pre_det = tf.concat([
            proposals.slice([0, 0], [proposals.shape[0], 4]),
            scores
        ], 1).asType('float32');
        const keep = this.nms(pre_det);
        // det = np.hstack( (pre_det, proposals[:,4:]) )
        let det = tf.concat([
            pre_det,
            proposals.slice([0, 4], [proposals.shape[0], proposals.shape[1]-4])
        ], 1);
        det = det.gather(keep, 0);
        if (this.use_landmarks) {
            landmarks = landmarks.gather(keep);
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
        const areas = x2.sub(x1).add(1).mul(y2.sub(y1).add(1));
        // order = scores.argsort()[::-1]
        let order = argsort(scores).reverse();

        const keep = [];
        while (order.length > 0) {
            let i = order[0];
            keep.push(order[0]);
            const xx1 = tf.maximum(x1.gather(i), x1.gather(order.slice(1)));
            const yy1 = tf.maximum(y1.gather(i), y1.gather(order.slice(1)));
            const xx2 = tf.minimum(x2.gather(i), x2.gather(order.slice(1)));
            const yy2 = tf.minimum(y2.gather(i), y2.gather(order.slice(1)));

            // w = np.maximum(0.0, xx2 - xx1 + 1)
            const w = tf.maximum(0.0, xx2.sub(xx1).add(1));
            // h = np.maximum(0.0, yy2 - yy1 + 1)
            const h = tf.maximum(0.0, yy2.sub(yy1).add(1));
            // inter = w * h
            const inter = w.mul(h);
            // ovr = inter / (areas[i] + areas[order[1:]] - inter)
            const ovr = inter.div(
                areas.gather(i).add(areas.gather(order.slice(1))).sub(inter)
            ).arraySync();

            // inds = np.where(ovr <= thresh)[0]
            const inds = where(ovr, v => v <= thresh);
            // console.log('ovr=', ovr, 'inds=', inds);
            // order = order[inds + 1]
            order = tf.tensor(order).gather(tf.tensor(inds).add(1).arraySync()).arraySync();
        }

        return keep;
    }

}
