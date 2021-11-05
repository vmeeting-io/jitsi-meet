// Conversion from onnx_inf_test.py to Javascript
import * as tf from '@tensorflow/tfjs';
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

    return converted;
}

// input: Int Tensor
export function normalize_frame(orig_image) {
    //not needed
    //image = cvt_Color_BGR2RGB(orig_image)

    //resize to 320 * 240 image
    const interpolated = bl_interpolate(orig_image, 240, 320);

    var res = interpolated.sub(tf.scalar(127)).div(tf.scalar(128));
    res = tf.transpose(res, [2, 0, 1]);
    res = res.expandDims(0);
    
    res = res.asType('float32');

    return res;
}

export function check_large_pose(landmark, bbox){
    if(landmark.shape[0] !== 5 || landmark.shape[1] !== 2)
        return;
    if(bbox.shape[0] !== 4)
        return;

    function get_theta(base, x, y){
        var vx = [x[0] - base[0], x[1] - base[1]];
        var vx = [y[0] - base[0], y[1] - base[1]];

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

    picked_box_probs = tf.concat(picked_box_probs);
    var c0 = picked_box_probs.gather(tf.tensor1d([0], 'int32'), 1).mul(width);
    var c1 = picked_box_probs.gather(tf.tensor1d([1], 'int32'), 1).mul(height);
    var c2 = picked_box_probs.gather(tf.tensor1d([2], 'int32'), 1).mul(width);
    var c3 = picked_box_probs.gather(tf.tensor1d([3], 'int32'), 1).mul(height);

    var result = tf.concat([c0, c1, c2, c3], 1);

    return result.asType('int32');
}

export function pred_landmarks(landmark_model, frame, box){
    box = box.arraySync();
    var cropped_face = frame.slice([box[1], box[0]], [box[3] - box[1], box[2] - box[0]]);
    cropped_face = bl_interpolate(cropped_face, 56, 56);

    cropped_face = cvt_Color_BGR2RGB(cropped_face, 56, 56);
    cropped_face = normalize_cropped_img(cropped_face);
    cropped_face = cropped_face.transpose([2, 0, 1]);
    // run model
    var landmark_68 = null;
    // landmark_68 = landmark_model.run(None, {'input': [cropped_face.astype(np.float32)]})  # [0, 1]
    // Let landmark_68 is a Tensor
    var landmark_item0 = landmark_68.gather(tf.tensor1d([0], 'int32')).squeeze(0);
    landmark_68 = landmark_item0.mul(tf.scalar(56)).round();
    landmark_68 = landmark_item0.reshape([-1, 2]);

    // landmark_seperate
    var face_landmarks = {}
    face_landmarks['left_eye'] = landmark_68.slice([42], [6]);
    face_landmarks['right_eye'] = landmark_68.slice([36], [6]);
    face_landmarks['nose'] = landmark_68.slice([27], [5]);
    face_landmarks['nose_end'] = landmark_68.gather(tf.tensor1d([30], 'int32'));
    face_landmarks['lips_end'] = landmark_68.gather(tf.tensor1d([48, 54], 'int32'));

    var landmark5 = []
    landmark5.push(face_landmarks['right_eye'].mean(0));
    landmark5.push(face_landmarks['left_eye'].mean(0));
    landmark5.push(face_landmarks['nose_end'].gather(tf.tensor1d([0], 'int32')).squeeze(0));
    landmark5.push(face_landmarks['left_eye'].gather(tf.tensor1d([0], 'int32')).squeeze(0));
    landmark5.push(face_landmarks['left_eye'].gather(tf.tensor1d([1], 'int32')).squeeze(0));

    var res_landmark5 = tf.stack(landmark5).round().asType('int32');
    var coords = res_landmark5.arraySync();

    var projected_coords = [];

    for(var i = 0; i < coords.length; i++){
        var scaled_x = (box[2] - box[0]) / 56.0 * coords[i][0];
        var scaled_y = (box[3] - box[1]) / 56.0 * coords[i][1];
        projected_coords.push([Math.round(scaled_x) + box[0], Math.round(scaled_y) + box[1]]);
    }

    var result = tf.tensor(projected_coords, 'int32');

    return result;
}

export function inference_frame(model, landmark_model, frame) {
    var frame_normed = normalize_frame(frame);
    var confidences, boxes;
    // run model
    // confidences, boxes = model.run(None, {input_name: frame_normed})
    console.log('inference_frame:', model.predict(frame_normed));
    // const prob_threshold = 0.7
    // var faces = predict_BB(frame.shape[1], frame.shape[0], confidences, boxes, prob_threshold)

    // var status = 0;
    // var ret = 5;
    // var iBoxTo4 = tf.Tensor([]);

    // // 얼굴이 검출되면
    // if (faces.shape[0] !== 0){
    //     for(var i = 0; i < faces.shape[0]; i++){
    //         var target = faces.gather(tf.tensor1d([i], 'int32')).squeeze(0);
    //         var iBox = tf.round(target).asType('int32');
    //         iBox.clipByValue(0, tf.int32.max);

    //         var landmark_5 = pred_landmarks(landmark_model, frame, iBox);
            
    //         iBoxTo4 = iBox.gather(tf.tensor1d([0, 1, 2, 3], 'int32'));
    //         ret = check_large_pose(landmark_5, iBoxTo4);

    //         if (ret === 0)
    //             status = 0;
    //         else
    //             status = 1;
    //     }
    // }
    // else{
    //     status = 2;
    // }

    // var boxes = [0, 0, 0, 0];
    // if (faces.shape[0] !== 1){
    //     boxes = iBoxTo4.arraySync();
    // }
    
    // return {
    //     face_len: faces.shape[0],
    //     status: status,
    //     boxes: boxes,
    //     ret: ret
    // }
}

// input: Int Tensor (img with range (0-255))
// Output: Float Tensor (img with range (0-255))
export function bl_interpolate(img, target_height, target_width){
    const resized_img = tf.image.resizeBilinear(img, [target_height, target_width]);

    return resized_img;
}

// swap channel 0 and channel 2
export function cvt_Color_BGR2RGB(orig_image){
    var [c0, c1, c2] = tf.split(orig_image, 3, 2);

    var converted = tf.concat([c2, c1, c0], 2);
    return converted;
}