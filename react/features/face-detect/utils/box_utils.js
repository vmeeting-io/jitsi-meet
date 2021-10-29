// Conversion from box_utils_numpy.py to Javascript
import * as tf from '@tensorflow/tfjs';

// Let inputs are tf.tensor
export function area_of(left_top, right_bottom){
    var hw = right_bottom.sub(left_top);
    var hw_clipped = hw.clipByValue(0.0, tf.float32.max);

    var [c0, c1] = tf.split(hw_clipped, 2, 1);
    var res = c0.mul(c1).transpose().squeeze(0);

    return res;
}

// Let inputs are tf.tensor
export function iou_of(boxes0, boxes1, eps=1e-5){
    var lt0 = boxes0.gather(tf.tensor1d([0, 1], 'int32'), axis=1);
    var lt1 = boxes1.gather(tf.tensor1d([0, 1], 'int32'), axis=1);
    var rb0 = boxes0.gather(tf.tensor1d([2, 3], 'int32'), axis=1);
    var rb1 = boxes1.gather(tf.tensor1d([2, 3], 'int32'), axis=1);

    var overlap_left_top = lt0.maximum(lt1);
    var overlap_right_bottom = rb0.maximum(rb1);

    var overlap_area = area_of(overlap_left_top, overlap_right_bottom);
    var area0 = area_of(lt0, rb0);
    var area1 = area_of(lt1, rb1);

    var denom = area0.add(area1).sub(overlap_area).add(tf.scalar(eps));
    var res = overlap_area.div(denom);

    return res;
}

export async function hard_nms(box_scores, iou_threshold, top_k=-1, candidate_size=200){
    var scores = box_scores.gather(tf.tensor1d([a.shape[1]-1], 'int32'), 1);
    var boxes = box_scores.gather(tf.range(0, a.shape[1]-1, 1, 'int32'), 1);

    var picked = [];

    var candidate_limit = scores.shape[0];
    if(candidate_limit > candidate_size)
        candidate_limit = candidate_size;

    var {values, indices} = tf.topk(a, candidate_limit);

    var index_arr = indices.arraySync();

    while(index_arr.length > 0){
        var current_index = index_arr[0];
        picked.push(current_index);

        if (0 < top_k === picked.length || index_arr.length === 1)
            break;
        
        var current_box = boxes.gather(tf.tensor1d([current_index], 'int32')).squeeze(0);
        index_arr.shift();

        const ascending_index = tf.range(0, a.shape[0], 1);
        var mask = tf.notEqual(ascending_index, tf.scalar(current_index));

        var rest_boxes = await tf.booleanMaskAsync(a, mask);
        var iou = iou_of(rest_boxes, current_box.expandDims(0));

        var index_mask = tf.lessEqual(iou, tf.scalar(iou_threshold));
        var masked_index = await tf.booleanMaskAsync(tf.tensor1d(index_arr, 'int32'), index_mask);
        index_arr = masked_index.arraySync();
    }
    
    var sorted_picked = picked.sort(function(a, b) {
        return a - b;
      });
    
    var res = box_scores.gather(tf.tensor1d(sorted_picked, 'int32'));

    return res;
}