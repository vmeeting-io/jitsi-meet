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
    src: string
}


export const IMAGES: Array<Image> = [
    {
        tooltip: 'image1',
        id: '1',
        src: 'images/virtual-background/background-1.jpg'
    },
    {
        tooltip: 'image2',
        id: '2',
        src: 'images/virtual-background/background-2.jpg'
    }
];
