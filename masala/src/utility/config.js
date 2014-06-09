
define([
    'utility/color'
], function (Color) {
    var config = {
        CANVAS: {
            debug: false,
            backgroundColor: new Color(0, 0, 0),
            multisampling: 1
        },

        SCENE: {
            paths: {
                meshes: '/masala/meshes/',
                shaders: '/masala/shaders/'
            }
        }
    };

    return config;
});