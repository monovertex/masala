
define([
    'shading/render',
    'gl/canvas/constants'
], function (lightingRender, constants) {

    return {
        render: function () {
            var color,
                context = this.context,
                canvas = this.canvas,
                rtt,
                resources,
                scene,
                source,
                target,
                aux,
                xStep, yStep, xSpeed, ySpeed;

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
                    rtt.framebuffer.bind();
                    context.viewport(0, 0, rtt.texture.width,
                        rtt.texture.height);
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

                context.uniform3f(
                    context._currentProgram.getUniformLoc('ambientLight'),
                    false, resources.ambientLight.r, resources.ambientLight.g,
                    resources.ambientLight.b);

                context._currentCamera.render(this.canvas, context);

                lightingRender(context, resources.lights);

                resources.tree.render(context, resources);

                // Postprocessing.
                if (this.postprocessingEnabled) {
                    source = this.postprocessing;
                    target = this.rtt;
                    xStep = 1.0 / canvas.width;
                    yStep = 1.0 / canvas.height;
                    xSpeed = Math.ceil(Math.abs(context._currentCamera
                        .mouseDisplacement.x) * 300);
                    ySpeed = Math.ceil(Math.abs(context._currentCamera
                        .mouseDisplacement.y) * 300);

                    context._currentCamera.resetMouseDisplacement();

                    _.each(resources.postprocessing, function (program) {
                        aux = source;
                        source = target;
                        target = aux;

                        target.framebuffer.bind();

                        this.clear();

                        this.useProgram(program);

                        context.uniform1f(program.getUniformLoc('xStep'),
                            xStep);
                        context.uniform1f(program.getUniformLoc('yStep'),
                            yStep);

                        context.uniform1i(program.getUniformLoc('xSpeed'),
                            xSpeed);
                        context.uniform1i(program.getUniformLoc('ySpeed'),
                            ySpeed);

                        source.texture.render(0);

                        rtt.mesh.render();
                    }, this);
                }

                // Render the RTT texture to the quad.
                if (this.rttEnabled) {
                    context.viewport(0, 0, canvas.width, canvas.height);

                    rtt.framebuffer.unbind();

                    this.clear();

                    rtt.program.use();

                    if (this.postprocessingEnabled) {
                        target.texture.render(0);
                    } else {
                        rtt.texture.render(0);
                    }

                    rtt.mesh.render();
                }
            } else {
                color = this.config.backgroundColor;
                context.clearColor(color.r, color.g, color.b, 1);

                console.log('loading');
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

                this.resizeRTT();
                this.resizePostprocessing();
            }
        }
    };

});