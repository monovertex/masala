
define([
    'utility/color'
], function (Color) {
    var config = {
        CANVAS: {
            debug: false,
            backgroundColor: new Color(0, 0, 0),
            preloadAnimation: true
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