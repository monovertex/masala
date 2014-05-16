

define([
    'underscore',
    'gl-matrix',

    'app/utility/config',
    'app/utility/class',

    'app/gl/canvas/initialize',
    'app/gl/canvas/render',

    'app/utility/debug-output',
    'webgl-debug',
    'request-animation-frame'
],
function (_, glm, baseConfig, Class, initialize, render, debugOutput) {

    return Class.extend(_.extend({

        initialize: function (canvas, config) {
            this.config = _.extend({}, baseConfig.CANVAS, config);

            this.scenes = {};

            this.canvas = canvas;
            this.context = canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl');

            if (this.config.DEBUG) {
                this.context = WebGLDebugUtils.makeDebugContext(
                    this.context, undefined, debugOutput);
            }

            this.context.enable(this.context.DEPTH_TEST);

            _.bindAll(this, 'setScene', 'initializeScene', 'render', 'resize');
        },

        setScene: function (scene, initialize) {

            this.scene = scene;
            this.sceneInitialize = initialize;

            if (_.isUndefined(this.scenes[scene.uid])) {
                this.scenes[scene.uid] = {};
                this.initializeScene(scene);
            }

            this.listen(scene, 'render', this.render);

            return this;
        },

        useCamera: function (camera) {
            camera.use(this.context);
        },

        useProgram: function (program) {
            program.use(this.context);
        }

    }, initialize, render));

});