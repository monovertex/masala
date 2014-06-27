
define([
    'utility/color'
], function (Color) {

    return {
        CANVAS: {
            debug: false,
            backgroundColor: new Color({ r: 0, b: 0, g: 0 }),
            preloadAnimation: true,
            fpsCounter: true
        },

        SCENE: {
            paths: {
                meshes: '/masala/meshes/',
                shaders: '/masala/shaders/'
            }
        }
    };
});