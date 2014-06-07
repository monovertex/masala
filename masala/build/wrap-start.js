
(function(root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(
            ['lodash', 'gl-matrix', 'keypress', 'webgl-debug'],
            function(_, glm, keypress) {
                factory(root, _, glm, keypress, root.WebGLDebugUtils);

                return root.Masala;
            }
        );
    } else {
        factory(root, root._, root, root.keypress, root.WebGLDebugUtils);
    }

}) (this, function(root, _, glm, keypress, WebGLDebugUtils) {

    var modules = {};
