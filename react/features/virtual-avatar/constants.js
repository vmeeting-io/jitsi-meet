// @flow

/**
 * An enumeration of the different virtual avatar types.
 *
 * @enum {string}
 */
export const VIRTUAL_AVATAR_TYPE = {
    IMAGE: 'image',
    NONE: 'none'
};


export type Image = {
    tooltip?: string,
    id: string,
    src: string,
    modelUrl: string
}


export const IMAGES: Array<Image> = [
    {
        tooltip: 'image1',
        id: '1',
        src: 'images/virtual-avatar/cartoon_boy.png',
        modelUrl: 'https://cdn.jsdelivr.net/gh/tu-nv/vrm_models/boy-4.vrm'
    },

    {
        tooltip: 'image2',
        id: '2',
        src: 'images/virtual-avatar/girl-1.jpg',
        modelUrl: 'https://cdn.jsdelivr.net/gh/tu-nv/vrm_models/girl-1.vrm'
    }
];
