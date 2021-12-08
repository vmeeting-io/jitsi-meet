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
    const image = cvt_Color_BGR2RGB(orig_image)

    const interpolated = bl_interpolate(image, height, width);

    // var res = interpolated.sub(tf.scalar(127)).div(tf.scalar(128));
    // res = tf.transpose(res, [2, 0, 1]);
    let res = tf.transpose(interpolated, [2, 0, 1]);
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

    const threshold = 3.0;
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
    return tf.tidy(() => {
        const bb = t.arraySync();
        return (bb[2] - bb[0]) * (bb[3] - bb[1]);
    });
}
