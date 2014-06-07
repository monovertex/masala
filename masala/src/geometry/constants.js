
define([
    'utility/constants'
], function (constants) {
    return {
        VERTEX: {
            SIZE: (8 * constants.SIZE.FLOAT),
            ITEM_SIZE: {
                POSITION: 3,
                NORMAL: 3,
                TEX_COORD: 2
            },
            ITEM_OFFSET: {
                POSITION: (0 * constants.SIZE.FLOAT),
                NORMAL: (3 * constants.SIZE.FLOAT),
                TEX_COORD: (6 * constants.SIZE.FLOAT)
            }
        },
        OBJ: {
            VERTEX: 'v',
            NORMAL: 'vn',
            TEXCOORD: 'vt',
            FACE: 'f',
            FACE_FORMAT: {
                V: 'v',
                VT: 'vt',
                VTN: 'vtn',
                VN: 'vn'
            }
        },
        MESHES: {
            CUBE: 'cube.obj'
        }
    };
});