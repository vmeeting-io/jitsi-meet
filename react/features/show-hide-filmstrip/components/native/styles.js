// @flow

import { ColorPalette } from '../../../base/styles';

export default {
    displayNameBackdrop: {
        alignSelf: 'center',
        backgroundColor: ColorPalette.G400,
        borderRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 4
    },

    displayNameText: {
        color: ColorPalette.white,
        fontSize: 14,
        textAlign: 'center'
    },

     filmstripNarrow: {
        position: 'relative',
        right: 180
    },

    filmstripWide: {
        // flexGrow: 0,
        position: 'relative',
        right: 130,
        top: 0
    }
};
