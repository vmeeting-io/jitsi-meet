# About adding new AR Object

The center of AR object image will be placed on the top keypoint (keypoints[10])

If you want to add new image, you should take this into account.

For example, for birthday_hat, I placed bottom point of the hat to the center of png file.

![image](https://user-images.githubusercontent.com/35196129/130735844-2079c253-86c0-4524-babe-26f409955a5a.png)

## How to use AR object image

You should change [this file](https://github.com/vmeeting-io/jitsi-meet/blob/tfjs-ar/react/features/stream-effects/ar-effect/JitsiStreamAREffect.js)

- line 65: Change to new image link
- line 112-115: Change to leftmost point, rightmost point to map
- line 118-121: Change to mapping keypoint index of line 112-115


## Keypoints

Mesh map image from https://github.com/tensorflow/tfjs-models/tree/master/facemesh

![mesh_map](https://user-images.githubusercontent.com/35196129/130735919-a6bde264-a135-462b-ac7d-370ed69f104a.jpg)

