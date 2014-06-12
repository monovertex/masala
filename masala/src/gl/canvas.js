

define([
    'utility/namespace',
    'utility/class',

    'gl/canvas/initialize',
    'gl/canvas/render',
    'gl/canvas/constants',
    'gl/canvas/rtt',
    'gl/canvas/postprocessing',
    'gl/canvas/extensions',
    'gl/canvas/extend-context',

    'utility/debug-output',

    'interaction/cursor'
], function (namespace, Class, initialize, render, constants, rtt,
        postprocessing, extensions, extendContext, debugOutput, cursor) {

    return Class.extend(_.extend({

        initialize: function (canvas, config) {
            var context;

            this.config = _.extend({}, namespace.config.CANVAS, config);

            if (constants.MULTISAMPLING.OPTIONS
                    .indexOf(this.config.multisampling) === -1) {
                this.config.multisampling = constants.MULTISAMPLING.NONE;
            }

            this.scenes = {};

            this.canvas = canvas;
            context = canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl');

            if (this.config.debug) {
                context = WebGLDebugUtils.makeDebugContext(context, undefined,
                    debugOutput);
            }

            context.enable(context.DEPTH_TEST);

            extendContext(context);

            this.context = context;

            this.initializeExtensions();

            if (this.config.multisampling !== constants.MULTISAMPLING.NONE) {
                this.initializeRTT();
            }

            _.bindAll(this, 'setScene', 'initializeScene', 'render', 'resize');

            this.canvas.addEventListener('click', function () {
                cursor.requestLock();
            });
        },

        setScene: function (scene, beforeFrame) {

            this.scene = scene;

            if (_.isUndefined(this.scenes[scene.uid])) {
                this.scenes[scene.uid] = {};
                this.initializeScene(scene);
            }

            this.scenes[scene.uid].beforeFrame = beforeFrame;

            this.listen(scene, 'render', this.render);

            return this;
        },

        useCamera: function (camera) {
            camera.use(this.context);
        },

        useProgram: function (program) {
            program.use(this.context);
        }

    }, initialize, render, rtt, postprocessing, extensions));

});