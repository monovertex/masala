

define([
    'utility/namespace',
    'utility/class',

    'gl/canvas/initialize',
    'gl/canvas/render',
    'gl/texture',
    'gl/canvas/constants',
    'gl/framebuffer',
    'gl/program',

    'geometry/mesh',

    'utility/debug-output',

    'interaction/cursor'
], function (namespace, Class, initialize, render, Texture, constants,
        Framebuffer, Program, Mesh, debugOutput, cursor) {

    return Class.extend(_.extend({

        initialize: function (canvas, config) {
            var context;

            this.config = _.extend({}, namespace.config.CANVAS, config);

            this.scenes = {};

            this.canvas = canvas;
            context = canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl');

            if (this.config.debug) {
                context = WebGLDebugUtils.makeDebugContext(context, undefined,
                    debugOutput);
            }

            context.enable(context.DEPTH_TEST);

            this.context = context;

            this.initializeRTT();

            _.bindAll(this, 'setScene', 'initializeScene', 'render', 'resize');

            this.canvas.addEventListener('click', function () {
                cursor.requestLock();
            });
        },

        initializeRTT: function () {
            var context = this.context,
                rtt = {
                    framebuffer: new Framebuffer(context),
                    program: new Program(context, constants.RTT.PROGRAM.shaders)
                };

            this.rtt = rtt;

            rtt.mesh = new Mesh(context, constants.RTT.MESH);

            this.resizeRTT();
        },

        resizeRTT: function () {
            var context = this.context,
                rtt = this.rtt,
                width = this.canvas.width * 2,
                height = this.canvas.height * 2;

            if (!_.isUndefined(rtt.texture)) {
                delete rtt.texture;
            }

            rtt.texture = new Texture(
                _.extend({
                    source: null,
                    width: width,
                    height: height
                }, constants.RTT.TEXTURE),
                context
            );

            rtt.framebuffer.attachColor(rtt.texture);

            if (!_.isUndefined(rtt.depthbuffer)) {
                delete rtt.depthbuffer;
            }

            rtt.depthbuffer = context.createRenderbuffer();

            context.bindRenderbuffer(context.RENDERBUFFER, rtt.depthbuffer);
            context.renderbufferStorage(
                context.RENDERBUFFER,
                context.DEPTH_COMPONENT16,
                width,
                height
            );

            rtt.framebuffer.attachDepth(rtt.depthbuffer);
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

    }, initialize, render));

});