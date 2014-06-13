
define([
    'shading/render',
    'gl/canvas/constants'
], function (lightingRender, constants) {

    return {
        render: function (initiator, eventName, eventData) {
            var color,
                context = this.context,
                canvas = this.canvas,
                rtt, resources, scene, source, target, aux,
                texelSize = {}, first, fps;

            this.resize();

            if (!_.isUndefined(this.scene) &&
                    !_.isUndefined(this.scenes[this.scene.uid]) &&
                    !_.isUndefined(this.scenes[this.scene.uid].resources)) {

                scene = this.scenes[this.scene.uid];
                resources = scene.resources;

                if (!_.isUndefined(resources.postprocessing)) {
                    this.initializePostprocessing();

                    if (!this.rttEnabled) {
                        this.initializeRTT();
                    }
                } else {
                    this.postprocessingEnabled = false;
                }

                rtt = this.rtt;

                if (this.rttEnabled) {
                    rtt.fbo.bind();
                    context.viewport(0, 0, rtt.colorTexture.width,
                        rtt.colorTexture.height);
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
                    this.config.backgroundColor;
                context.clearColor(color.r, color.g, color.b, 1);

                context.uniform3f('ambientLight', false,
                    resources.ambientLight.r, resources.ambientLight.g,
                    resources.ambientLight.b);

                context._currentCamera.render(this.canvas, context);

                lightingRender(context, resources.lights);

                resources.tree.render(context, resources);

                if (this.rttEnabled) {
                    rtt.fbo.unbind();
                }


                // Postprocessing.
                if (this.postprocessingEnabled) {
                    source = this.postprocessing.primary;
                    target = this.postprocessing.secondary;
                    first = true;

                    texelSize.x = 1.0 / canvas.width;
                    texelSize.y = 1.0 / canvas.height;

                    fps = 1.0 / eventData.interval;

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
                if (this.rttEnabled) {
                    context.viewport(0, 0, canvas.width, canvas.height);

                    this.clear();

                    rtt.program.use();

                    if (this.postprocessingEnabled) {
                        target.colorTexture.render(0);
                    } else {
                        rtt.colorTexture.render(0);
                    }

                    rtt.mesh.render();
                }
            }
        },

        clear: function () {
            this.context.clear(this.context.COLOR_BUFFER_BIT |
                this.context.DEPTH_BUFFER_BIT);
        },

        resize: function () {
            var canvas = this.canvas, context = this.context;

            if (canvas.width !== canvas.clientWidth ||
                canvas.height !== canvas.clientHeight) {

                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;

                this.trigger('resize');
                this.resizeRTT();
                this.resizePostprocessing();
            }
        }
    };

});