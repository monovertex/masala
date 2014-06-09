
define([
    'shading/render',
    'gl/canvas/constants'
], function (lightingRender, constants) {

    return {
        render: function () {
            var color,
                context = this.context,
                canvas = this.canvas,
                rtt = this.rtt,
                resources,
                scene;

            this.resize();

            if (!_.isUndefined(this.scene) &&
                    !_.isUndefined(this.scenes[this.scene.uid]) &&
                    !_.isUndefined(this.scenes[this.scene.uid].resources)) {

                scene = this.scenes[this.scene.uid];

                rtt.framebuffer.bind();

                this.clear();

                context.viewport(0, 0, rtt.texture.width, rtt.texture.height);

                resources = scene.resources;

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

                rtt.framebuffer.unbind();

                this.clear();

                // Render the RTT texture to the quad.
                context.viewport(0, 0, canvas.width, canvas.height);

                rtt.program.use();

                rtt.texture.render(0);

                rtt.mesh.render();

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
            }
        }
    };

});