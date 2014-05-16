
define(['app/utility/color'], function (Color) {
    var config = {
        CANVAS: {
            DEBUG: false,
            BACKGROUND_COLOR: new Color(0, 0, 0)
        },

        SCENE: {
            PATHS: {
                MESHES: 'meshes/',
                SHADERS: 'shaders/'
            }
        }
    };

    return config;
});