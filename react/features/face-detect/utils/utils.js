// Conversion from onnx_inf_test.py to Javascript
import '@tensorflow/tfjs-backend-cpu';
import * as tf from '@tensorflow/tfjs';
import { map, range } from 'lodash';

import * as box_utils from './box_utils';

// input: Tensor
export function normalize_cropped_img(input){
    var mean = [0.485, 0.456, 0.406];
    var std = [0.229, 0.224, 0.225];

    var fInput = input.div(tf.scalar(255.0));
    var [c0, c1, c2] = tf.split(fInput, 3, 2);
    
    c0 = c0.sub(tf.scalar(mean[0])).div(tf.scalar(std[0]));
    c1 = c1.sub(tf.scalar(mean[1])).div(tf.scalar(std[1]));
    c2 = c2.sub(tf.scalar(mean[2])).div(tf.scalar(std[2]));

    var converted = tf.concat([c0, c1, c2], 2);

    return converted.asType('float32');
}

// input: Int Tensor
export function normalize_frame(orig_image) {
    //not needed
    // const image = cvt_Color_BGR2RGB(orig_image)

    //resize to 320 * 240 image
    const interpolated = bl_interpolate(orig_image, 240, 320);

    var res = interpolated.sub(tf.scalar(127)).div(tf.scalar(128));
    res = tf.transpose(res, [2, 0, 1]);
    res = res.expandDims(0);
    
    res = res.asType('float32');

    return res;
}

export function get_thetas(landmark, bbox) {
    if (landmark[0] !== 5 || landmark[1] !== 2)
        return;
    if (bbox.length !== 4)
        return;

    function get_theta(base, x, y) {
        var vx = [x[0] - base[0], x[1] - base[1]];
        var vy = [y[0] - base[0], y[1] - base[1]];
        vx[1] *= -1
        vy[1] *= -1

        var tx = Math.atan2(vx[1], vx[0]);
        var ty = Math.atan2(vy[1], vy[0]);
        var d = ty - tx;
        d = d *  180.0 / Math.PI;

        if (d < -180.0)
            d += 360.0;
        else
            d -= 360.0;
    
        return d;
    }

    theta1 = get_theta(landmark[0], landmark[3], landmark[2]);
    theta2 = get_theta(landmark[1], landmark[2], landmark[4]);
    // print(va, vb, theta2)
    theta3 = get_theta(landmark[0], landmark[2], landmark[1]);
    theta4 = get_theta(landmark[1], landmark[0], landmark[2]);
    theta5 = get_theta(landmark[3], landmark[4], landmark[2]);
    theta6 = get_theta(landmark[4], landmark[2], landmark[3]);
    theta7 = get_theta(landmark[3], landmark[2], landmark[0]);
    theta8 = get_theta(landmark[4], landmark[1], landmark[2]);
    // print(theta1, theta2, theta3, theta4, theta5, theta6, theta7, theta8)

    thetas = [theta1, theta2, theta3, theta4, theta5, theta6, theta7, theta8];

    return thetas
}

export function check_large_pose(landmark, bbox) {
    if(landmark.shape[0] !== 5 || landmark.shape[1] !== 2)
        return;
    if(bbox.shape[0] !== 4)
        return;

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
        else
            d -= 360.0;

        return d;
    }

    landmark = landmark.asType('float32');
    var ld_arr = landmark.arraySync();
    var box_arr = bbox.arraySync();
    
    // returned float value
    var theta1 = get_theta(ld_arr[0], ld_arr[3], ld_arr[2]);
    var theta2 = get_theta(ld_arr[1], ld_arr[2], ld_arr[4]);
    var theta3 = get_theta(ld_arr[0], ld_arr[2], ld_arr[1]);
    var theta4 = get_theta(ld_arr[1], ld_arr[0], ld_arr[2]);
    var theta5 = get_theta(ld_arr[3], ld_arr[4], ld_arr[2]);
    var theta6 = get_theta(ld_arr[4], ld_arr[2], ld_arr[3]);
    var theta7 = get_theta(ld_arr[3], ld_arr[2], ld_arr[0]);
    var theta8 = get_theta(ld_arr[4], ld_arr[1], ld_arr[2]);

    var left_score = 0.0;
    var right_score = 0.0;
    var up_score = 0.0;
    var down_score = 0.0;

    if (theta1 <= 0.0)
        left_score = 10.0;
    else if (theta2 <= 0.0)
        right_score = 10.0;
    else{
        left_score = theta2 / theta1;
        right_score = theta1 / theta2;
    }

    if (theta3 <= 10.0 || theta4 <= 10.0)
        up_score = 10.0;
    else
        up_score = Math.max(theta1 / theta3, theta2 / theta4);

    if (theta5 <= 10.0 || theta6 <= 10.0)
        down_score = 10.0;
    else
        down_score = Math.max(theta7 / theta5, theta8 / theta6);

    var mleft = (ld_arr[0][0] + ld_arr[3][0]) / 2;
    var mright = (ld_arr[1][0] + ld_arr[4][0]) / 2;
    var box_center = [(box_arr[0] + box_arr[2]) / 2, (box_arr[1] + box_arr[3]) / 2];
    var ret = 0;

    if (left_score >= 3.0)
        ret = 1;
    if (ret === 0 && left_score >= 2.0){
        if (mright <= box_center[0])
            ret = 1;
    }
    if (ret === 0 && right_score >= 3.0)
        ret = 2;
    if (ret === 0 && right_score >= 2.0){
        if (mleft >= box_center[0])
            ret = 2;
    }
    if (ret === 0 && up_score >= 2.0)
        ret = 3;
    if (ret === 0 && down_score >= 6.0)
        ret = 4;

    return ret;
}

export function check_large_pose_from_ref(landmark, bbox, ref_lr_ratio, ref_ud_ratio) {
    if (landmark.length !== 5 || landmark[1].length !== 2)
        return;
    if (bbox.length !== 4)
        return;

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
        else
            d -= 360.0;

        return d;
    }
    
    // returned float value
    var theta1 = get_theta(landmark[0], landmark[3], landmark[2]);
    var theta2 = get_theta(landmark[1], landmark[2], landmark[4]);
    var theta3 = get_theta(landmark[0], landmark[2], landmark[1]);
    var theta4 = get_theta(landmark[1], landmark[0], landmark[2]);
    var theta5 = get_theta(landmark[3], landmark[4], landmark[2]);
    var theta6 = get_theta(landmark[4], landmark[2], landmark[3]);
    var theta7 = get_theta(landmark[3], landmark[2], landmark[0]);
    var theta8 = get_theta(landmark[4], landmark[1], landmark[2]);

    const lr_ratio = (theta1 + theta7) / (theta2 + theta8)
    const ud_ratio = (theta3 + theta4) / (theta5 + theta6)

    const threshold = 2.0
    // # print("ref_lr:", ref_lr_ratio, "lr:", lr_ratio, "ref_ud:",ref_ud_ratio, "ud:",ud_ratio)

    let ret = 0;
    if ((lr_ratio <= (ref_lr_ratio/threshold) || lr_ratio >= (ref_lr_ratio*threshold)) ||
        (ud_ratio <= (ref_ud_ratio/threshold) || ud_ratio >= (ref_ud_ratio*threshold)))
        ret = 1;

    return ret;
}

// Input
// Output: Tensor
export async function predict_BB(width, height, confidences, boxes, prob_threshold, iou_threshold=0.3, top_k=-1){
    // let all variables are tensor
    var box = boxes.gather(tf.tensor1d([0], 'int32')).squeeze(0);
    var confidence = confidences.gather(tf.tensor1d([0], 'int32')).squeeze(0);

    var picked_box_probs = [];

    for(var class_index = 1; class_index < confidence.shape[1]; class_index++){
        //confidence에서 column이 class_index인 값을 추출
        var probs = confidence.gather(tf.tensor1d([class_index], 'int32'), 1).transpose().squeeze(0);
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
    var c0 = picked_box_probs.gather(tf.tensor1d([0], 'int32'), 1).mul(width);
    var c1 = picked_box_probs.gather(tf.tensor1d([1], 'int32'), 1).mul(height);
    var c2 = picked_box_probs.gather(tf.tensor1d([2], 'int32'), 1).mul(width);
    var c3 = picked_box_probs.gather(tf.tensor1d([3], 'int32'), 1).mul(height);

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
    landmark5.push(tf.tensor(face_landmarks['right_eye']).mean(0).arraySync());
    landmark5.push(tf.tensor(face_landmarks['left_eye']).mean(0).arraySync());
    landmark5.push(face_landmarks['nose_end'][0]);
    landmark5.push(face_landmarks['lips_end'][0]);
    landmark5.push(face_landmarks['lips_end'][1]);

    var coords = tf.stack(landmark5)
        .round()
        .asType('int32')
        .arraySync();

    var projected_coords = [];
    for (var i = 0; i < coords.length; i++) {
        var scaled_x = (box[2] - box[0]) / resize_shape[0] * coords[i][0];
        var scaled_y = (box[3] - box[1]) / resize_shape[1] * coords[i][1];
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

export async function getReferenceData(model, landmarkModel, frame) {
    const frameNormed = normalize_frame(frame);

    const output = await model.predict(frameNormed);
    // console.log('getReferenceData: output=', output);

    const boxes = output[0];
    const confidences = output[1];

    const faces = await predict_BB(frame.shape[1], frame.shape[0], confidences, boxes, 0.7);

    if (faces.shape[0] > 0) {
        const areas = range(faces.shape[0]).map(index => {
            return calc_BB_area(tf.gather(faces, [index]).squeeze());
        });
        const maxIndex = areas.indexOf(Math.max(...areas));

        // console.log('getReferenceData: faces=', faces.arraySync());
        let box = tf.round(tf.gather(faces, [maxIndex]).squeeze()).asType('int32');
        box = box.clipByValue(0, Number.MAX_VALUE).arraySync();

        const [ landmark5, face_landmarks ] = await pred_landmarks(landmarkModel, frame, box);
        // console.log('pred_landmarks:', landmark5, face_landmarks);

        const thetas = get_thetas(landmark5, box.slice([0], [4]));
        const [ _, r_EAR, l_EAR, eyes_area ] = is_eye_close(face_landmarks, 0.15);

        return [
            { r_EAR, l_EAR, eyes_area, landmark5, thetas },
            1,
            box
        ];
    } else {
        return [ null, 0, [0, 0, 0, 0] ];
    }
}

export async function inferenceFrame(model, landmarkModel, frame, refData) {
    const frameNormed = normalize_frame(frame);

    const output = await model.predict(frameNormed);
    const boxes = output[0];
    const confidences = output[1];
    const faces = await predict_BB(frame.shape[1], frame.shape[0], confidences, boxes, 0.7);

    let eyeClose = false;
    let box = [0, 0, 0, 0];
    let status = 0;
    let landmarks = [];

    // 얼굴이 검출되면
    if (faces.shape[0] > 0) {
        const areas = range(faces.shape[0]).map(index => {
            return calc_BB_area(tf.gather(faces, [index]).squeeze());
        });
        const max = Math.max(...areas);
        const maxIndex = areas.indexOf(max);

        if (max <= frame.shape[0] * frame.shape[1] * 0.05) {
            status = 2;
        } else {
            box = tf.round(tf.gather(faces, [maxIndex]).squeeze()).asType('int32');
            box = box.clipByValue(0, Number.MAX_VALUE).arraySync();
    
            landmarks = await pred_landmarks(landmarkModel, frame, box);
            const [ landmark5, face_landmarks ] = landmarks;

            // console.log('pred_landmarks:', landmark5, face_landmarks);

            const meanEyeArea = tf.mean(map(refData, 'eyes_area')).arraySync();
            console.log('MEA:', meanEyeArea);

            eyeClose = false;
            if (meanEyeArea >= 200) {
                const maxL = Math.max(...map(refData, 'l_EAR'));
                const maxR = Math.max(...map(refData, 'r_EAR'));
                const threshold = (maxL + maxR) / 2.0 * 0.6;
                eyeClose = is_eye_close(face_landmarks, threshold)[0];
            }

            const avgThetas = tf.mean(map(refData, 'thetas'), [0]).arraySync();
            const refRatioLR = (avgThetas[0] + avgThetas[6]) / (avgThetas[1] + avgThetas[7]);
            const refRatioUD = (avgThetas[2] + avgThetas[3]) / (avgThetas[4] + avgThetas[5]);

            const ret = check_large_pose_from_ref(landmark5, box.slice(0, 4), refRatioLR, refRatioUD);

            status = ret === 0 ? 0 : 1; // 집중(0), 비집중(1) 여부
        }
    } else {
        status = 2;
    }

    return [status, eyeClose, box, landmarks];
}

// input: Int Tensor (img with range (0-255))
// Output: Float Tensor (img with range (0-255))
export function bl_interpolate(img, ax=1.0, ay=1.0){
    const resized_img = tf.image.resizeBilinear(img, [target_height, target_width], true);
    // const [H, W, C] = img.shape;
    // const aH = Math.round(ay * H);
    // const aW = Math.round(ax * W);
    // // get position of resized image
    // let y = tf.tile(tf.range(0, aH).expandDims(-1), [1, 320]);
    // let x = tf.tile(tf.range(0, aW), [aH]).reshape([aH, aW]);

    // y = y.div(tf.scalar(ay));
    // x = x.div(tf.scalar(ax));
    // let ix = tf.floor(x).asType('int32');
    // let iy = tf.floor(y).asType('int32');
    // ix = tf.minimum(ix, tf.scalar(W - 2));
    // iy = tf.minimum(iy, tf.scalar(H - 2));

    // let dx = x.sub(ix);
    // let dy = y.sub(iy);
    // dx = tf.tile(dx.expandDims(-1), [1,1,3]);
    // dy = tf.tile(dy.expandDims(-1), [1,1,3]);


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
