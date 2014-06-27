
define([
    'shading/render',
    'gl/canvas/constants'
], function (lightingRender, constants) {

    return {
        render: function (ev) {
            var color,
                context = this.get('context'),
                canvas = this.get('canvas'),
                currentScene = this.get('currentScene'),
                scenes = this.get('scenes'),
                rtt, postprocessing, resources, scene, source, target, aux,
                texelSize = {}, first, fps;

            this.resize();

            if (!_.isUndefined(currentScene) &&
                    !_.isUndefined(scenes[currentScene.uid]) &&
                    !_.isUndefined(scenes[currentScene.uid].resources)) {

                scene = scenes[currentScene.uid];
                resources = scene.resources;

                if (!_.isUndefined(resources.postprocessing)) {
                    this.initializePostprocessing();

                    if (!this.get('rtt.enabled')) {
                        this.initializeRTT();
                    }
                } else {
                    this.set('postprocessing.enabled', false);
                }

                rtt = this.get('rtt');

                if (rtt.enabled) {
                    rtt.fbo.bind();
                    context.viewport(0, 0, rtt.colorTexture.get('width'),
                        rtt.colorTexture.get('height'));
                } else {
                    context.viewport(0, 0, canvas.width, canvas.height);
                }

                this.clear();

                this.useProgram(resources.defaultProgram);
                this.useCamera(resources.defaultCamera);

                if (_.isFunction(scene.beforeFrame)) {
                    scene.beforeFrame.call(this, resources);
                }

                color = resources.backgroundColor ||
                    this.get('config.backgroundColor');
                context.clearColor(color.r, color.g, color.b, 1);

                context.uniform3f('ambientLight', false,
                    resources.ambientLight.r, resources.ambientLight.g,
                    resources.ambientLight.b);

                context._currentCamera.render(canvas.width, canvas.height,
                    context);

                lightingRender(context, resources.lights);

                resources.tree.render(context, resources);

                if (rtt.enabled) {
                    rtt.fbo.unbind();
                }

                postprocessing = this.get('postprocessing');

                // Postprocessing.
                if (postprocessing.enabled) {
                    source = postprocessing.primary;
                    target = postprocessing.secondary;
                    first = true;

                    texelSize.x = 1.0 / canvas.width;
                    texelSize.y = 1.0 / canvas.height;

                    fps = 1.0 / ev.data.interval;

                    _.each(resources.postprocessing, function (program) {
                        aux = source;
                        source = target;
                        target = aux;

                        target.fbo.bind();

                        this.clear();

                        this.useProgram(program);

                        context.uniform2f('texelSize', texelSize.x, texelSize.y);

                        context.uniform1f('fps', fps);

                        context._currentCamera.sendUniforms(context);

                        if (first) {
                            rtt.colorTexture.render(0);
                            first = false;
                        } else {
                            source.colorTexture.render(0);
                        }
                        rtt.depthTexture.render(1, 'depthTexture');

                        rtt.mesh.render();

                        target.fbo.unbind();
                    }, this);
                }

                // Render the RTT texture to the quad.
                if (rtt.enabled) {
                    context.viewport(0, 0, canvas.width, canvas.height);

                    this.clear();

                    rtt.program.use();

                    if (postprocessing.enabled) {
                        target.colorTexture.render(0);
                    } else {
                        rtt.colorTexture.render(0);
                    }

                    rtt.mesh.render();
                }
            }

            this.trigger('finishRendering');
        },

        clear: function () {
            var context = this.get('context');

            context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
        },

        resize: function () {
            var canvas = this.get('canvas');

            if (canvas.width !== canvas.clientWidth ||
                canvas.height !== canvas.clientHeight) {

                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;

                this.trigger('resize');
            }
        }
    };

});