export const script = `
# import onnxruntime as ort
# import os
# import cv2
import numpy as np
import time
# import json
# import box_utils_numpy as box_utils
import copy
import js

def convert_locations_to_boxes(locations, priors, center_variance,
                               size_variance):
    """Convert regressional location results of SSD into boxes in the form of (center_x, center_y, h, w).

    The conversion:
        $$predicted\_center * center_variance = \frac {real\_center - prior\_center} {prior\_hw}$$
        $$exp(predicted\_hw * size_variance) = \frac {real\_hw} {prior\_hw}$$
    We do it in the inverse direction here.
    Args:
        locations (batch_size, num_priors, 4): the regression output of SSD. It will contain the outputs as well.
        priors (num_priors, 4) or (batch_size/1, num_priors, 4): prior boxes.
        center_variance: a float used to change the scale of center.
        size_variance: a float used to change of scale of size.
    Returns:
        boxes:  priors: [[center_x, center_y, h, w]]. All the values
            are relative to the image size.
    """
    # priors can have one dimension less.
    if len(priors.shape) + 1 == len(locations.shape):
        priors = np.expand_dims(priors, 0)
    return np.concatenate([
        locations[..., :2] * center_variance * priors[..., 2:] + priors[..., :2],
        np.exp(locations[..., 2:] * size_variance) * priors[..., 2:]
    ], axis=len(locations.shape) - 1)


def convert_boxes_to_locations(center_form_boxes, center_form_priors, center_variance, size_variance):
    # priors can have one dimension less
    if len(center_form_priors.shape) + 1 == len(center_form_boxes.shape):
        center_form_priors = np.expand_dims(center_form_priors, 0)
    return np.concatenate([
        (center_form_boxes[..., :2] - center_form_priors[..., :2]) / center_form_priors[..., 2:] / center_variance,
        np.log(center_form_boxes[..., 2:] / center_form_priors[..., 2:]) / size_variance
    ], axis=len(center_form_boxes.shape) - 1)


def area_of(left_top, right_bottom):
    """Compute the areas of rectangles given two corners.

    Args:
        left_top (N, 2): left top corner.
        right_bottom (N, 2): right bottom corner.

    Returns:
        area (N): return the area.
    """
    hw = np.clip(right_bottom - left_top, 0.0, None)
    return hw[..., 0] * hw[..., 1]


def iou_of(boxes0, boxes1, eps=1e-5):
    """Return intersection-over-union (Jaccard index) of boxes.

    Args:
        boxes0 (N, 4): ground truth boxes.
        boxes1 (N or 1, 4): predicted boxes.
        eps: a small number to avoid 0 as denominator.
    Returns:
        iou (N): IoU values.
    """
    overlap_left_top = np.maximum(boxes0[..., :2], boxes1[..., :2])
    overlap_right_bottom = np.minimum(boxes0[..., 2:], boxes1[..., 2:])

    overlap_area = area_of(overlap_left_top, overlap_right_bottom)
    area0 = area_of(boxes0[..., :2], boxes0[..., 2:])
    area1 = area_of(boxes1[..., :2], boxes1[..., 2:])
    return overlap_area / (area0 + area1 - overlap_area + eps)


def center_form_to_corner_form(locations):
    return np.concatenate([locations[..., :2] - locations[..., 2:] / 2,
                           locations[..., :2] + locations[..., 2:] / 2], len(locations.shape) - 1)


def corner_form_to_center_form(boxes):
    return np.concatenate([
        (boxes[..., :2] + boxes[..., 2:]) / 2,
        boxes[..., 2:] - boxes[..., :2]
    ], len(boxes.shape) - 1)


def hard_nms(box_scores, iou_threshold, top_k=-1, candidate_size=200):
    """
    Args:
        box_scores (N, 5): boxes in corner-form and probabilities.
        iou_threshold: intersection over union threshold.
        top_k: keep top_k results. If k <= 0, keep all the results.
        candidate_size: only consider the candidates with the highest scores.
    Returns:
         picked: a list of indexes of the kept boxes
    """
    scores = box_scores[:, -1]
    boxes = box_scores[:, :-1]
    picked = []
    # _, indexes = scores.sort(descending=True)
    indexes = np.argsort(scores)
    # indexes = indexes[:candidate_size]
    indexes = indexes[-candidate_size:]
    while len(indexes) > 0:
        # current = indexes[0]
        current = indexes[-1]
        picked.append(current)
        if 0 < top_k == len(picked) or len(indexes) == 1:
            break
        current_box = boxes[current, :]
        # indexes = indexes[1:]
        indexes = indexes[:-1]
        rest_boxes = boxes[indexes, :]
        iou = iou_of(
            rest_boxes,
            np.expand_dims(current_box, axis=0),
        )
        indexes = indexes[iou <= iou_threshold]

    return box_scores[picked, :]

# def check_model(path=None):
#     import onnx
#     if path is None:
#         path= r"./onnx_models/(Realtime)RetinaFace_model.onnx"

#     model = onnx.load(path)
#     print(onnx.helper.printable_graph(model.graph)) # Check the model
#     onnx.checker.check_model(model)
#     print('The model is checked!')

def normalize_cropped_img(input):
    mean = [0.485, 0.456, 0.406]
    std = [0.229, 0.224, 0.225]
    input = input/255.0

    for i in range(3):
        input[:, :, i] = (input[:, :, i] - mean[i])/std[i]

    return input

def normalize_frame(orig_image):
    # image = cv2.cvtColor(orig_image,cv2.COLOR_BGR2RGB)
    # image = cv2.resize(image, (320, 240))

    time_time=time.time()
    image = cvt_Color_BGR2RGB(orig_image)
    print("resize time:", time.time() - time_time)
    image = bl_interpolate(image, 320./float(image.shape[1]), 240./float(image.shape[0]))

    image_mean = np.array([127, 127, 127])
    image = (image - image_mean) / 128
    image = np.transpose(image, [2, 0, 1])
    image = np.expand_dims(image, axis=0)
    image = image.astype(np.float32)
    return image

def check_large_pose(landmark, bbox):
    assert landmark.shape == (5, 2)
    assert len(bbox) == 4

    def get_theta(base, x, y):
        vx = x - base
        vy = y - base
        vx[1] *= -1
        vy[1] *= -1
        tx = np.arctan2(vx[1], vx[0])
        ty = np.arctan2(vy[1], vy[0])
        d = ty - tx
        d = np.degrees(d)
        # print(vx, tx, vy, ty, d)
        # if d<-1.*math.pi:
        #  d+=2*math.pi
        # elif d>math.pi:
        #  d-=2*math.pi
        if d < -180.0:
            d += 360.
        elif d > 180.0:
            d -= 360.0
        return d

    landmark = landmark.astype(np.float32)

    theta1 = get_theta(landmark[0], landmark[3], landmark[2])
    theta2 = get_theta(landmark[1], landmark[2], landmark[4])
    # print(va, vb, theta2)
    theta3 = get_theta(landmark[0], landmark[2], landmark[1])
    theta4 = get_theta(landmark[1], landmark[0], landmark[2])
    theta5 = get_theta(landmark[3], landmark[4], landmark[2])
    theta6 = get_theta(landmark[4], landmark[2], landmark[3])
    theta7 = get_theta(landmark[3], landmark[2], landmark[0])
    theta8 = get_theta(landmark[4], landmark[1], landmark[2])
    # print(theta1, theta2, theta3, theta4, theta5, theta6, theta7, theta8)
    left_score = 0.0
    right_score = 0.0
    up_score = 0.0
    down_score = 0.0
    if theta1 <= 0.0:
        left_score = 10.0
    elif theta2 <= 0.0:
        right_score = 10.0
    else:
        left_score = theta2 / theta1
        right_score = theta1 / theta2

    if theta3 <= 10.0 or theta4 <= 10.0:
        up_score = 10.0
    else:
        up_score = max(theta1 / theta3, theta2 / theta4)

    if theta5 <= 10.0 or theta6 <= 10.0:
        down_score = 10.0
    else:
        down_score = max(theta7 / theta5, theta8 / theta6)

    mleft = (landmark[0][0] + landmark[3][0]) / 2
    mright = (landmark[1][0] + landmark[4][0]) / 2
    box_center = ((bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2)
    ret = 0
    if left_score >= 3.0:
        ret = 1
    if ret == 0 and left_score >= 2.0:
        if mright <= box_center[0]:
            ret = 1
    if ret == 0 and right_score >= 3.0:
        ret = 2
    if ret == 0 and right_score >= 2.0:
        if mleft >= box_center[0]:
            ret = 2
    if ret == 0 and up_score >= 2.0:
        ret = 3
    if ret == 0 and down_score >= 6.0:
        ret = 4
    return ret, left_score, right_score, up_score, down_score

# def create_face_det_model(path=None): #Model import from .onnx
#     if path is None:
#         path= r"./onnx_models/(Realtime)RetinaFace_model.onnx"

#     if os.path.isfile(path):  # 해당 파일이 있는지 확인
#         sess_ort = ort.InferenceSession(path)  # .onnx model import
        # model = FaceDetector(model=sess_ort)  # detection model object
        # model.prepare(nms=0.4) #nms: non-maximum suppression 임계치
#         return sess_ort
#     else:
#         print("파일이 존재하지 않습니다.")

# def create_landmark_det_model(path=None): #Detection Model import
#     if path is None:
#         path= r"./onnx_models/Landmark_detection_model.onnx"

#     if os.path.isfile(path):  # 해당 파일이 있는지 확인
#         sess_ort = ort.InferenceSession(path)  # import

#         return sess_ort
#     else:
#         print("파일이 존재하지 않습니다.")

# def load_video(path=None):
#     if path is None:
#         path = r"./sample_data.mp4"

#     if os.path.isfile(path):  # 해당 파일이 있는지 확인
#         # 영상 객체(파일) 가져오기
#         video = cv2.VideoCapture(path)
#     else:
#         print("파일이 존재하지 않습니다.")

#     return video

# def make_json(dict, dir):
#     with open(dir, "w") as f:
#         json.dump(dict, f, indent="\t")

# def Inference_video(model, landmark_model, video, json_dir, show_results=False):

#         # 프레임을 정수형으로 형 변환

#         frameWidth = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))  # 영상의 넓이(가로) 프레임
#         frameHeight = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))  # 영상의 높이(세로) 프레임
#         frame_size = (frameWidth, frameHeight)
#         print('frame_size={}'.format(frame_size))
#         frame_num = 0

#         ###  Inference
#         while True:
#             retval, frame = video.read()
#             if not (retval) or frame_size is (0, 0):  # 프레임정보를 정상적으로 읽지 못하면
#                 break
#             Num_faces, Status, Bounding_box, Face_direction = Inference_frame(model, landmark_model, frame,
#                                                                               show_results=show_results)

#             frame_num += 1
#             dict = {
#                 'Frame': frame_num + 1,
#                 'Num_faces': Num_faces,
#                 'Status': Status,
#                 'Bounding_box': Bounding_box,
#                 'Face_direction': Face_direction
#             }

#             make_json(dict, dir=json_dir)

#             cv2.imshow('frame', frame)  # 프레임 보여주기
#             key = cv2.waitKey(10)  # frameRate: msec동안 한 프레임

#             if key == 27:  # ESC
#                 break  # while문을 빠져나가기

def Calc_EAR(eye): #Eye Aspect Ratio

    def euclidean_distance(leftx, lefty, rightx, righty):
        return np.sqrt((leftx - rightx) ** 2 + (lefty - righty) ** 2)

    def midpoint(p1, p2):
        return int((p1[0] + p2[0]) / 2), int((p1[1] + p2[1]) / 2)

    left_point = eye[3]
    right_point = eye[0]

    center_top = midpoint(eye[1], eye[2])
    center_bottom = midpoint(eye[4], eye[5])

    horizontal_len = euclidean_distance(left_point[0], left_point[1], right_point[0], right_point[1])
    vertical_len = euclidean_distance(center_top[0], center_top[1], center_bottom[0], center_bottom[1])

    return vertical_len/horizontal_len

def predict_BB(width, height, confidences, boxes, prob_threshold, iou_threshold=0.3, top_k=-1):
    boxes = boxes[0]
    confidences = confidences[0]
    picked_box_probs = []
    picked_labels = []
    for class_index in range(1, confidences.shape[1]):
        probs = confidences[:, class_index]
        mask = probs > prob_threshold
        probs = probs[mask]
        if probs.shape[0] == 0:
            continue
        subset_boxes = boxes[mask, :]
        box_probs = np.concatenate([subset_boxes, probs.reshape(-1, 1)], axis=1)
        box_probs = hard_nms(box_probs,
                             iou_threshold=iou_threshold,
                             top_k=top_k)
        picked_box_probs.append(box_probs)
        picked_labels.extend([class_index] * box_probs.shape[0])

    if not picked_box_probs:
        return np.array([]), np.array([]), np.array([])

    picked_box_probs = np.concatenate(picked_box_probs)
    picked_box_probs[:, 0] *= width
    picked_box_probs[:, 1] *= height
    picked_box_probs[:, 2] *= width
    picked_box_probs[:, 3] *= height

    return picked_box_probs[:, :4].astype(np.int32), np.array(picked_labels), picked_box_probs[:, 4]

def pred_landmarks(landmark_model, frame, box):
    def reproject_coords(coords, box):  # 56x56에서 예측된 landmark들을 320x180으로 다시 reprojection
        projected_coords = []
        for x, y in coords:
            scaled_x = float(box[2] - box[0]) / 56. * float(x)
            scaled_y = float(box[3] - box[1]) / 56. * float(y)
            projected_coords.append([int(scaled_x) + box[0], int(scaled_y) + box[1]])
        return np.asarray(projected_coords)

    def landmark_separate(landmark68):  # 68개의 landamrk들을 left eye, right eye, nose, left lips, right lips로 분류
        l_eye = landmark68[42:48]
        r_eye = landmark68[36:42]
        nose = landmark68[27:32]

        nose_end = [landmark68[30]]
        lips_end = [landmark68[48], landmark68[54]]

        dict = {"left_eye": l_eye,
                "right_eye": r_eye,
                "nose": nose,
                "nose_end": nose_end,
                "lips_end": lips_end}
        return dict

    cropped_face = frame[box[1]:box[3], box[0]:box[2], :]
    try:
        cropped_face = bl_interpolate(cropped_face, 56. / float(cropped_face.shape[1]),
                                      56. / float(cropped_face.shape[0]))  # landmark detection모델의 input size: 56x56
        # cropped_face = bl_interpolate(cropped_face, 56, 56)  # landmark detection모델의 input size: 56x56
    except:
        print("failed to resize!")

    # cropped_face = cv2.cvtColor(cropped_face, cv2.COLOR_BGR2RGB)
    cropped_face = cvt_Color_BGR2RGB(cropped_face)
    cropped_face = normalize_cropped_img(cropped_face)
    cropped_face = np.transpose(cropped_face, [2, 0, 1])
    landmark_68 = landmark_model.run(None, {'input': [cropped_face.astype(np.float32)]})  # [0, 1]
    landmark_68 = [np.round(item * 56) for item in landmark_68[0]]  # [0,1] to [56,56] coordinates
    landmark_68 = landmark_68[0].reshape((-1, 2))

    face_landmarks = landmark_separate(landmark_68)

    landmark5 = []
    landmark5.append(np.mean(face_landmarks['right_eye'], axis=0))
    landmark5.append(np.mean(face_landmarks['left_eye'], axis=0))
    landmark5.append(face_landmarks["nose_end"][0])
    landmark5.append(face_landmarks["lips_end"][0])
    landmark5.append(face_landmarks["lips_end"][1])
    landmark5 = np.round(np.asarray(landmark5)).astype(np.int)  # landmark 좌표 float to int

    return reproject_coords(landmark_68, box), reproject_coords(landmark5, box), face_landmarks

def is_eye_close(face_landmark, threshold=0.2):
    r_EAR = Calc_EAR(face_landmark["right_eye"])
    l_EAR = Calc_EAR(face_landmark["left_eye"])

    if r_EAR <= threshold and l_EAR <= threshold:
        return True
    else:
        return False

def Inference_frame(model, landmark_model, frame, show_results=False):
    # 프레임을 정수형으로 형 변환
    input_name = model.get_inputs()[0].name
    frame_normed = normalize_frame(frame)
    time_time= time.time()
    confidences, boxes = model.run(None, {input_name: frame_normed})
    faces, _, _ = predict_BB(frame.shape[1], frame.shape[0], confidences, boxes, prob_threshold=0.7)
    print("inference_time:", time.time() - time_time)

    status = 0
    eye_close=False
    if faces is not None:  # 얼굴이 검출 되었다면
        for i in range(faces.shape[0]):
            box = np.round(faces[i]).astype(np.int)  # bounding box 좌표 float to int
            box = np.clip(box, 0, None) # to make all positive values

            landmark_68, landmark_5, face_landmark = pred_landmarks(landmark_model, frame, box) #얼굴 내 landmark 추출 (68개: 턱선, 눈 코,입술,
                                                                                                                     # 5개: 왼쪽 눈 가운데, 오른쪽 눈 가운데, 코, 왼쪽 입꼬리 끝, 오른쪽 입꼬리 끝
                                                                                                                     # face_landmark: 눈, 코, 입에 대한 좌표 dictionary

            ret, left_score, right_score, up_score, down_score = check_large_pose(landmark=landmark_5, bbox=box[:4])  # bounding box내의 얼굴의 방향
            status = 0 if ret is 0 else 1  # 집중(0), 비집중(1), 자리이탈(2) 여부
            eye_close = is_eye_close(face_landmark, threshold=0.15) # 눈깜빡임 정도

            # if show_results:  # 결과 확인
            #     box_color = (0, 0, 255)  # box 색깔
            #     cv2.rectangle(frame, (box[0], box[1]), (box[2], box[3]), box_color, 2)
            #     font = cv2.FONT_HERSHEY_SIMPLEX
            #     cv2.putText(frame, str(eye_close), (int((box[0]+box[2])/2), int(box[3]-20)), font, 0.5, (255, 0, 0), 2)
            #     cv2.putText(frame, str(ret), (50, 50), font, 1, (255, 0, 0), 2)
            #     # for l in range(landmark5.shape[0]):  # 오른쪽 눈, 입꼬리만 파란색
            #     #     # color = (0, 0, 255)
            #     #     # if l == 0 or l == 3:
            #     #     color = (0, 0, 255)
            #     #     cv2.circle(frame, (landmark5[l][0], landmark5[l][1]), 1, color, 2)

            #     for x, y in face_landmark["right_eye"]:
            #         scaled_x = float(box[2] - box[0])/56. * float(x)
            #         scaled_y = float(box[3] - box[1])/56. * float(y)
            #         cv2.circle(frame, (int(scaled_x)+box[0], int(scaled_y)+box[1]), 1, (0, 255, 0), -1)

            #     for x, y in face_landmark["left_eye"]:
            #         scaled_x = float(box[2] - box[0])/56. * float(x)
            #         scaled_y = float(box[3] - box[1])/56. * float(y)
            #         cv2.circle(frame, (int(scaled_x)+box[0], int(scaled_y)+box[1]), 1, (0, 255, 0), -1)

    else:  # 얼굴 검출이 안되었다면
        status = 2  # 자리이탈

    return len(faces), status, box[:4].tolist() if len(faces) is 1 else [0, 0, 0, 0],  ret if len(faces) is 1 else 5

def bl_interpolate(img, ax=1., ay=1.):
    H, W, C = img.shape
    aH = round(ay * H)
    aW = round(ax * W)
    # get position of resized image
    y = np.arange(aH).repeat(aW).reshape(aH, -1)
    x = np.tile(np.arange(aW), (aH, 1))

    # get position of original position
    y = (y / ay)
    x = (x / ax)
    ix = np.floor(x).astype(np.int)
    iy = np.floor(y).astype(np.int)
    ix = np.minimum(ix, W-2)
    iy = np.minimum(iy, H-2)

    # get distance
    dx = x - ix
    dy = y - iy
    dx = np.repeat(np.expand_dims(dx, axis=-1), 3, axis=-1)
    dy = np.repeat(np.expand_dims(dy, axis=-1), 3, axis=-1)

    # interpolation
    out = (1-dx) * (1-dy) * img[iy, ix] + dx * (1 - dy) * img[iy, ix+1] + (1 - dx) * dy * img[iy+1, ix] + dx * dy * img[iy+1, ix+1]
    out = np.clip(out, 0, 255)
    out = out.astype(np.uint8)
    return out

def cvt_Color_BGR2RGB(orig_image):
    image = copy.deepcopy(orig_image)
    image[:, :, 2] = orig_image[:, :, 0]
    image[:, :, 0] = orig_image[:, :, 2]
    return image

# Inference_video(model = create_face_det_model(),
#                 landmark_model = create_landmark_det_model(),
#                 video = load_video(path=r"./sample_data.mp4"),
#                 json_dir = r"./Result.json",
#                 show_results=True)

Inference_frame(js.face_model, js.landmark_model, js.frame)
`;