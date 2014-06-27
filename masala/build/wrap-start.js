
(function(root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(
            ['lodash', 'gl-matrix', 'keypress', 'simplex-noise', 'webgl-debug'],
            function(_, glm, keypress) {
                return factory(root, _, glm, keypress, SimplexNoise,
                    root.WebGLDebugUtils);
            }
        );
    } else {
        root.Masala = factory(root, root._, root, root.keypress,
            root.SimplexNoise, root.WebGLDebugUtils);
    }

}) (this, function(root, _, glm, keypress, SimplexNoise, WebGLDebugUtils) {

    var modules = {};
