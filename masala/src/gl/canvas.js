

define([
    'scaffolding/namespace',
    'scaffolding/class',

    'gl/canvas/initialize',
    'gl/canvas/render',
    'gl/canvas/constants',
    'gl/canvas/rtt',
    'gl/canvas/postprocessing',
    'gl/canvas/extensions',
    'gl/canvas/extend-context',
    'gl/canvas/loader',
    'gl/canvas/fps-counter',

    'utility/debug-output',

    'interaction/cursor'
], function (namespace, Class, initialize, render, constants, rtt,
        postprocessing, extensions, extendContext, loader, fpsCounter,
        debugOutput, cursor) {

    return Class.extend(_.extend({

        initialize: function (attributes, options) {
            _.bindAll(this, 'setScene', 'initializeScene', 'render', 'resize');

            var canvas = this.get('canvas'),
                context,
                config = _.merge({}, namespace.config.CANVAS, options);

            this.set('config', config)
                .set('scenes', {})
                .set('rtt', { initialize: false, enabled: false })
                .set('postprocessing', { initialize: false, enabled: false });

            context = canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl');

            if (config.debug) {
                context = WebGLDebugUtils.makeDebugContext(context, undefined,
                    debugOutput);
            }

            context.enable(context.DEPTH_TEST);

            extendContext(context);

            this.set('context', context);

            this.initializeExtensions();

            if (config.preloadAnimation) {
                this.initializeLoader();
            }

            if (config.fpsCounter) {
                this.initializeFpsCounter();
            }

            canvas.addEventListener('click', cursor.requestLock);
        },

        setScene: function (scene, callbacks) {

            var scenes = this.get('scenes');

            this.set('currentScene', scene);

            if (_.isUndefined(scenes[scene.uid])) {
                scenes[scene.uid] = { callbacks: {} };
                this.initializeScene(scene);
            }

            _.extend(scenes[scene.uid].callbacks, callbacks);

            this.listenTo(scene, 'render', this.render);

            return this;
        },

        useCamera: function (camera) {
            camera.use(this.get('context'));
        },

        useProgram: function (program) {
            program.use(this.get('context'));
        }

    },
        initialize,
        render,
        rtt,
        postprocessing,
        extensions,
        loader,
        fpsCounter
    ), {

        setConfig: function (config) {
            _.extend(namespace.config.CANVAS, config);
        }

    });

});