// Conversion from onnx_inf_test.py to Javascript
import '@tensorflow/tfjs-backend-cpu';
import * as tf from '@tensorflow/tfjs';
import { isEqual, map, range } from 'lodash';

import * as box_utils from './box_utils';

// input: Tensor
export function normalize_cropped_img(input){
    var mean = [0.485, 0.456, 0.406];
    var std = [0.229, 0.224, 0.225];

    var fInput = input.div(tf.scalar(255.0));
    var c = tf.split(fInput, 3, 2);
    
    for (let i = 0; i < 1; i++) {
        c[i] = c[i].sub(tf.scalar(mean[i])).div(tf.scalar(std[i]));
    }

    var converted = tf.concat(c, 2);
    return converted.asType('float32');
}

// input: Int Tensor
export function normalize_frame(orig_image, height, width) {
    //not needed
    // const image = cvt_Color_BGR2RGB(orig_image)

    const interpolated = bl_interpolate(orig_image, height, width);

    var res = interpolated.sub(tf.scalar(127)).div(tf.scalar(128));
    res = tf.transpose(res, [2, 0, 1]);
    res = res.expandDims(0);
    
    res = res.asType('float32');

    return res;
}

export function get_thetas(landmark, bbox) {
    if (landmark.length !== 5 || landmark[0].length !== 2) {
        console.error('landmark shape should be [5,2].');
        return;
    }
    if (bbox.length !== 4) {
        console.error('bbox length should be 4.');
        return;
    }

    function get_theta(base, x, y) {
        var vx = [x[0] - base[0], x[1] - base[1]];
        var vy = [y[0] - base[0], y[1] - base[1]];

        vx[1] *= -1;
        vy[1] *= -1;

        var tx = Math.atan2(vx[1], vx[0]);
        var ty = Math.atan2(vy[1], vy[0]);
        var d = ty - tx;
        d = d *  180.0 / Math.PI;

        if (d < -180.0)
            d += 360.0;
        else if (d > 180.0)
            d -= 360.0;
    
        return d;
    }

    const theta1 = get_theta(landmark[0], landmark[3], landmark[2]);
    const theta2 = get_theta(landmark[1], landmark[2], landmark[4]);
    // print(va, vb, theta2)
    const theta3 = get_theta(landmark[0], landmark[2], landmark[1]);
    const theta4 = get_theta(landmark[1], landmark[0], landmark[2]);
    const theta5 = get_theta(landmark[3], landmark[4], landmark[2]);
    const theta6 = get_theta(landmark[4], landmark[2], landmark[3]);
    const theta7 = get_theta(landmark[3], landmark[2], landmark[0]);
    const theta8 = get_theta(landmark[4], landmark[1], landmark[2]);
    // print(theta1, theta2, theta3, theta4, theta5, theta6, theta7, theta8)

    const thetas = [theta1, theta2, theta3, theta4, theta5, theta6, theta7, theta8];

    return thetas
}

export function check_large_pose_from_ref(landmark, bbox, ref_lr_ratio, ref_ud_ratio) {
    if (landmark.length !== 5 || landmark[0].length !== 2) {
        console.error('landmark shape should be (5,2).');
        return;
    }
    if (bbox.length !== 4) {
        console.error('bbox length should be 4.');
        return;
    }

    function get_theta(base, x, y) {
        var vx = [x[0] - base[0], x[1] - base[1]];
        var vy = [y[0] - base[0], y[1] - base[1]];

        vx[1] *= -1;
        vy[1] *= -1;

        var tx = Math.atan2(vx[1], vx[0]);
        var ty = Math.atan2(vy[1], vy[0]);
        var d = ty - tx;
        d = d *  180.0 / Math.PI;

        if (d < -180.0)
            d += 360.0;
        else if (d > 180.0)
            d -= 360.0;

        return d;
    }
    
    var theta1 = get_theta(landmark[0], landmark[3], landmark[2]);
    var theta2 = get_theta(landmark[1], landmark[2], landmark[4]);
    var theta3 = get_theta(landmark[0], landmark[2], landmark[1]);
    var theta4 = get_theta(landmark[1], landmark[0], landmark[2]);
    var theta5 = get_theta(landmark[3], landmark[4], landmark[2]);
    var theta6 = get_theta(landmark[4], landmark[2], landmark[3]);
    var theta7 = get_theta(landmark[3], landmark[2], landmark[0]);
    var theta8 = get_theta(landmark[4], landmark[1], landmark[2]);

    const lr_ratio = (theta1 + theta7) / (theta2 + theta8);
    const ud_ratio = (theta3 + theta4) / (theta5 + theta6);

    const threshold = 2.0;
    // # print("ref_lr:", ref_lr_ratio, "lr:", lr_ratio, "ref_ud:",ref_ud_ratio, "ud:",ud_ratio)

    let ret = 0;
    if ((lr_ratio <= (ref_lr_ratio/threshold) || lr_ratio >= (ref_lr_ratio*threshold))
     || (ud_ratio <= (ref_ud_ratio/threshold) || ud_ratio >= (ref_ud_ratio*threshold)))
    {
        ret = 1;
    }

    return ret;
}

// Input
// Output: Tensor
export async function predict_BB(width, height, confidences, boxes, prob_threshold, iou_threshold=0.3, top_k=-1){
    // let all variables are tensor
    var box = boxes.gather(0);
    var confidence = confidences.gather(0);

    var picked_box_probs = [];

    // console.log(`boxes.shape=${boxes.shape}, confidences.shape=${confidences.shape}`);
    for (var class_index = 1; class_index < confidence.shape[1]; class_index++) {
        //confidence에서 column이 class_index인 값을 추출
        var probs = confidence.gather(class_index, 1);
        var thres_tensor = tf.fill(probs.shape, prob_threshold);
        var mask = tf.greater(probs, thres_tensor);
        var masked_prob = await tf.booleanMaskAsync(probs, mask);
        if (masked_prob.shape[0] === 0)
            continue;
        //boxes의 mask번째 row 추출
        var subset_boxes = await tf.booleanMaskAsync(box, mask);
        var box_probs = tf.concat([subset_boxes, masked_prob.reshape([-1, 1])], 1);
        box_probs = await box_utils.hard_nms(box_probs, iou_threshold, top_k);
        picked_box_probs.push(box_probs);
    }

    if (picked_box_probs.length === 0)
        return tf.tensor([]);

    picked_box_probs = tf.concat(picked_box_probs).clipByValue(0, 1);
    // console.log('predict_BB:', picked_box_probs.arraySync());
    var c0 = picked_box_probs.gather([0], 1).mul(width);
    var c1 = picked_box_probs.gather([1], 1).mul(height);
    var c2 = picked_box_probs.gather([2], 1).mul(width);
    var c3 = picked_box_probs.gather([3], 1).mul(height);

    var result = tf.concat([c0, c1, c2, c3], 1);

    return result.asType('int32');
}

export async function pred_landmarks(landmark_model, frame, box){
    const resize_shape = [112, 112];

    // console.log('pred_landmarks:', frame.shape, box);
    var cropped_face = frame.slice([box[1], box[0]], [box[3] - box[1], box[2] - box[0]]);
    // console.log('cropped_face:', cropped_face.shape, box);

    cropped_face = bl_interpolate(cropped_face, resize_shape[0], resize_shape[1]);
    cropped_face = cvt_Color_BGR2RGB(cropped_face);
    cropped_face = normalize_cropped_img(cropped_face);
    cropped_face = cropped_face.transpose([2, 0, 1]).asType('float32');
    
    // inference
    var landmark_68 = null;
    landmark_68 = await landmark_model.executeAsync(cropped_face.expandDims());

    // Let landmark_68 is a Tensor
    const landmarks = landmark_68.squeeze()
        .mul(tf.scalar(resize_shape[0]))
        .round()
        .reshape([-1, 2])
        .arraySync();

    // landmark_seperate
    var face_landmarks = {}
    face_landmarks['left_eye'] = landmarks.slice(42, 48);
    face_landmarks['right_eye'] = landmarks.slice(36, 42);
    face_landmarks['nose'] = landmarks.slice(27, 32);

    face_landmarks['nose_end'] = [landmarks[30]];
    face_landmarks['lips_end'] = [landmarks[48], landmarks[54]];

    var landmark5 = []
    landmark5.push(tf.tensor(face_landmarks['right_eye']).mean(0).arraySync()); // 오른쪽 눈 중간값
    landmark5.push(tf.tensor(face_landmarks['left_eye']).mean(0).arraySync());  // 왼쪽 눈 중간값
    landmark5.push(face_landmarks['nose_end'][0]);  // 코 끝
    landmark5.push(face_landmarks['lips_end'][0]);  // 오른쪽 입꼬리
    landmark5.push(face_landmarks['lips_end'][1]);  // 왼쪽 입꼬리

    var coords = tf.stack(landmark5)
        .round()
        .asType('int32')
        .arraySync();

    var projected_coords = [];
    for (var i = 0; i < coords.length; i++) {
        const [x, y] = coords[i];
        var scaled_x = (box[2] - box[0]) / resize_shape[0] * x;
        var scaled_y = (box[3] - box[1]) / resize_shape[1] * y;
        projected_coords.push([Math.round(scaled_x) + box[0], Math.round(scaled_y) + box[1]]);
    }

    return [ projected_coords, face_landmarks ];
}

export function calcEar(eye) { // Eye Aspect Ratio

    function euclidean_distance(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    }

    function midpoint(p1, p2) {
        return [Math.round((p1[0] + p2[0]) / 2), Math.round((p1[1] + p2[1]) / 2)];
    }

    const left_point = eye[3];
    const right_point = eye[0];

    const center_top = midpoint(eye[1], eye[2]);
    const center_bottom = midpoint(eye[4], eye[5]);

    const horizontal_len = euclidean_distance(left_point[0], left_point[1], right_point[0], right_point[1]);
    const vertical_len = euclidean_distance(center_top[0], center_top[1], center_bottom[0], center_bottom[1]);
    const eye_area = horizontal_len * vertical_len;

    return [vertical_len / horizontal_len, eye_area];
}


export function is_eye_close(face_landmark, threshold=0.2) {
    const [ r_EAR, r_Area ] = calcEar(face_landmark["right_eye"])
    const [ l_EAR, l_Area ] = calcEar(face_landmark["left_eye"])
    // print("threshold:", threshold, "r_EAR:", r_EAR, "l_EAR",l_EAR)
    if ((r_EAR <= threshold) || (l_EAR <= threshold)) {
        return [true, r_EAR, l_EAR, r_Area+l_Area];
    } else {
        return [false, r_EAR, l_EAR, r_Area+l_Area];
    }
}

// input: Int Tensor (img with range (0-255))
// Output: Float Tensor (img with range (0-255))
export function bl_interpolate(img, target_height, target_width){
    const resized_img = tf.image.resizeBilinear(img, [target_height, target_width], true);
    return resized_img;
}

// swap channel 0 and channel 2
export function cvt_Color_BGR2RGB(orig_image){
    var [c0, c1, c2] = tf.split(orig_image, 3, 2);

    var converted = tf.concat([c2, c1, c0], 2);
    return converted;
}

// calc bounding box area
// input: area tensor
export function calc_BB_area(t) {
    const bb = t.arraySync();
    return (bb[2] - bb[0]) * (bb[3] - bb[1]);
}

/*
 * Return width, height, x center, and y center for an anchor (window).
 */
function _whctrs(anchor) {
    const a = anchor.squeeze().arraySync();
    const w = a[2] - a[0] + 1;
    const h = a[3] - a[1] + 1;
    const x_ctr = tf.scalar(a[0] + 0.5 * (w - 1));
    const y_ctr = tf.scalar(a[1] + 0.5 * (h - 1));
    
    return { w, h, x_ctr, y_ctr };
}


export function resize_image(img, scales) {
    const [img_w, img_h] = img.shape.slice(0, 2);
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

export function preprocess_image(img) {
    const pixel_means = [0.0, 0.0, 0.0].map(v => tf.scalar(v));
    const pixel_stds = [1.0, 1.0, 1.0].map(v => tf.scalar(v));
    const pixel_scale = tf.scalar(1.0);
    const scales = [1024, 1980];

    let [resized_img, im_scale] = resize_image(img, scales);
    resized_img = resized_img.asType('float32');

    // Make image scaling + BGR2RGB conversion + transpose (N,H,W,C) to (N,C,H,W)
    // for i in range(3):
    //     im_tensor[0, :, :, i] = (img[:, :, 2 - i] / pixel_scale - pixel_means[2 - i]) / pixel_stds[2 - i]
    let im_tensor = [];
    for (let i = 0; i < 3; i += 1) {
        im_tensor[0] = resized_img.gather(tf.tenser1d([2 - i], 'int32'), 2)
            .div(pixel_scale)
            .sub(pixel_means[2 - i])
            .div(pixel_stds[2 - i]);
    }
    im_tensor = tf.concat(im_tensor, 3);

    return [im_tensor, resized_img.shape.slice(0, 2), im_scale];
}

/*
 * Given a vector of widths (ws) and heights (hs) around a center
 * (x_ctr, y_ctr), output a set of anchors (windows).
 */
export function _mkanchors(ws, hs, x_ctr, y_ctr) {
    const ws1 = ws.expandDims(1);
    const hs1 = hs.expandDims(1);
    const anchors = tf.concat([
        // x_ctr - 0.5 * (ws1 - 1),
        x_ctr.sub(tf.scalar(0.5).mul(ws1.sub(tf.scalar(1)))),
        // y_ctr - 0.5 * (hs1 - 1),
        y_ctr.sub(tf.scalar(0.5).mul(hs1.sub(tf.scalar(1)))),
        // x_ctr + 0.5 * (ws1 - 1),
        x_ctr.add(tf.scalar(0.5).mul(ws1.sub(tf.scalar(1)))),
        // y_ctr + 0.5 * (hs1 - 1)
        y_ctr.add(tf.scalar(0.5).mul(hs1.sub(tf.scalar(1))))
    ], 1);

    return anchors;
}

/*
 * Enumerate a set of anchors for each aspect ratio wrt an anchor.
 * anchor: tensor
 * ratios: tensor
 */
export function _ratio_enum(anchor, ratios) {
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
export function _scale_enum(anchor, scales) {
    const { w, h, x_ctr, y_ctr } = _whctrs(anchor);
    const ws = scales.mul(tf.scalar(w));
    const hs = scales.mul(tf.scalar(h));
    const anchors = _mkanchors(ws, hs, x_ctr, y_ctr);
    return anchors;
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
export function anchors_plane(height, width, stride, base_anchors) {
    const A = base_anchors.shape[0];
    // all_anchors = np.zeros((height, width, A, 4), dtype=np.float32)
    const all_anchors = tf.buffer([height, width, A, 4]);

    for (let iw in range(width)) {
        const sw = iw * stride;
        for (let ih in range(height)) {
            const sh = ih * stride;
            for (let k in range(A)) {
                all_anchors.set(base_anchors[k, 0] + sw, ih, iw, k, 0);
                all_anchors.set(base_anchors[k, 1] + sh, ih, iw, k, 1);
                all_anchors.set(base_anchors[k, 2] + sw, ih, iw, k, 2);
                all_anchors.set(base_anchors[k, 3] + sh, ih, iw, k, 3);
            }
        }
    }

    return all_anchors.toTensor();
}

/*
 * Generate anchor (reference) windows by enumerating aspect ratios X
 * scales wrt a reference (0, 0, 15, 15) window.
 */
export function generate_anchors(base_size=16, ratios=tf.tensor([0.5, 1, 2]),
                     scales=tf.scalar(2).pow(range(3, 6)), stride=16)
{
    const base_anchor = tf.tensor([1, 1, base_size, base_size]).sub(tf.scalar(1));
    const ratio_anchors = _ratio_enum(base_anchor, ratios);
    // anchors = np.vstack([_scale_enum(ratio_anchors[i, :], scales)
    //                      for i in range(ratio_anchors.shape[0])])
    const anchors = range(ratio_anchors.shape[0]).map(i => {
        return _scale_enum(ratio_anchors.gather(tf.tensor1d([i], 'int32'), 0), scales);
    });
    return tf.concat(anchors);
}

/*
 * Generate anchor (reference) windows by enumerating aspect ratios X
 * scales wrt a reference (0, 0, 15, 15) window.
 */
export function generate_anchors_fpn(cfg) {
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

    return anchors
}

/*
 * Clip boxes of the pad area.
 * :param tensor: [n, c, H, W]
 * :param pad_shape: [h, w]
 * :return: [n, c, h, w]
 */
export function clip_pad(tensor, pad_shape) {
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
export function bbox_pred(boxes, box_deltas) {
    if (boxes.shape[0] == 0) {
        return np.zeros([0, box_deltas.shape[1]]);
    }

    const fboxes = boxes.asType('float32');
    // widths = boxes[:, 2] - boxes[:, 0] + 1.0
    const widths = fboxes.gather(tf.tensor1d([2], 'int32'), 1)
        .sub(tf.tensor1d([0], 'int32'), 1)
        .add(tf.scalar(1.0));
    // heights = boxes[:, 3] - boxes[:, 1] + 1.0
    const heights = fboxes.gather(tf.tensor1d([3], 'int32'), 1)
        .sub(tf.tensor1d([1], 'int32'), 1)
        .add(tf.scalar(1.0));
    // ctr_x = boxes[:, 0] + 0.5 * (widths - 1.0)
    const ctr_x = fboxes.gather(tf.tensor1d([0], 'int32'), 1)
        .add(widths.sub(tf.scalar(1.0)).mul(tf.scalar(0.5)));
    // ctr_y = boxes[:, 1] + 0.5 * (heights - 1.0)
    const ctr_y = fboxes.gather(tf.tensor1d([1], 'int32'), 1)
        .add(heights.sub(tf.scalar(1.0)).mul(tf.scalar(0.5)));

    // dx = box_deltas[:, 0:1]
    const dx = box_deltas.gather(tf.tensor1d([0], 'int32'), 1);
    // dy = box_deltas[:, 1:2]
    const dy = box_deltas.gather(tf.tensor1d([1], 'int32'), 1);
    // dw = box_deltas[:, 2:3]
    const dw = box_deltas.gather(tf.tensor1d([2], 'int32'), 1);
    // dh = box_deltas[:, 3:4]
    const dh = box_deltas.gather(tf.tensor1d([3], 'int32'), 1);

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
    pred_boxes.push(pred_ctr_x.sub(pred_w.sub(tf.scalar(1.0).mul(tf.scalar(0.5)))));
    // # y1
    // pred_boxes[:, 1:2] = pred_ctr_y - 0.5 * (pred_h - 1.0)
    pred_boxes.push(pred_ctr_y.sub(pred_h.sub(tf.scalar(1.0).mul(tf.scalar(0.5)))));
    // # x2
    // pred_boxes[:, 2:3] = pred_ctr_x + 0.5 * (pred_w - 1.0)
    pred_boxes.push(pred_ctr_x.add(pred_w.sub(tf.scalar(1.0).mul(tf.scalar(0.5)))));
    // # y2
    // pred_boxes[:, 3:4] = pred_ctr_y + 0.5 * (pred_h - 1.0)
    pred_boxes.push(pred_ctr_y.add(pred_h.sub(tf.scalar(1.0).mul(tf.scalar(0.5)))));

    pred_boxes = tf.concat(pred_boxes);

    return pred_boxes;
}

export function landmark_pred(boxes, landmark_deltas) {
    if (boxes.shape[0] == 0) {
        return tf.zeros([0, landmark_deltas.shape[1]]);
    }

    boxes = boxes.asType('float32');
    // widths = boxes[:, 2] - boxes[:, 0] + 1.0
    const widths = boxes.gather(tf.tensor1d([2], 'int32'), 1)
        .sub(boxes.gather(tf.tensor1d([0], 'int32'), 1))
        .add(tf.scalar(1.0));
    // heights = boxes[:, 3] - boxes[:, 1] + 1.0
    const heights = boxes.gather(tf.tensor1d([3], 'int32'), 1)
        .sub(boxes.gather(tf.tensor1d([1], 'int32'), 1))
        .add(tf.scalar(1.0));
    // ctr_x = boxes[:, 0] + 0.5 * (widths - 1.0)
    const ctr_x = boxes.gather(tf.tensor1d([0], 'int32'), 1)
        .add(widths.sub(tf.scalar(1.0)).mul(tf.scalar(0.5)));
    // ctr_y = boxes[:, 1] + 0.5 * (heights - 1.0)
    const ctr_y = boxes.gather(tf.tensor1d([1], 'int32'), 1)
        .add(heights.sub(tf.scalar(1.0)).mul(tf.scalar(0.5)));

    const pred = landmark_deltas.clone();

    // for i in range(5):
    //     pred[:,i,0] = landmark_deltas[:,i,0] * widths + ctr_x
    //     pred[:,i,1] = landmark_deltas[:,i,1] * heights + ctr_y

    const c = tf.split(landmark_deltas, 5, 2)
    for (let i = 0; i < 5; i += 1) {
        const [x, y] = tf.split(c[i].gather(tf.tensor1d([i], 'int32'), 1), 2, 2);
        const cx = x.mul(widths).add(ctr_x);
        const cy = y.mul(heights).add(ctr_y);
        c[i] = tf.concat([cx, cy], 2);
    }

    const converted = tf.concat(c, 2);

    return converted;
}

export function argsort(array) {
    const argIndices = array
        .map((value, idx) => { return { value, idx }; })
        .sort((a, b) => a.value - b.value)
        .map(data => data.idx);

    return argIndices;
}
