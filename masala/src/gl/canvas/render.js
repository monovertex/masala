
define([
    'shading/render'
], function (lightingRender) {

    return {
        render: function () {
            var color;

            this.resize();

            this.context.clear(this.context.COLOR_BUFFER_BIT |
                    this.context.DEPTH_BUFFER_BIT);

            if (!_.isUndefined(this.scene) &&
                    !_.isUndefined(this.scenes[this.scene.uid]) &&
                    !_.isUndefined(this.scenes[this.scene.uid].resources)) {

                var resources = this.scenes[this.scene.uid].resources;

                color = resources.backgroundColor ||
                    this.config.backgroundColor;
                this.context.clearColor(color.r, color.g, color.b, 1);

                this.context.uniform3f(
                    this.context._currentProgram.getUniformLoc('ambientLight'),
                    false, resources.ambientLight.r, resources.ambientLight.g,
                    resources.ambientLight.b);

                this.context._currentCamera.render(this.canvas, this.context);

                lightingRender(this.context, resources.lights);

                resources.tree.render(this.context, resources);

            } else {
                color = this.config.backgroundColor;
                this.context.clearColor(color.r, color.g, color.b, 1);

                console.log('loading');
            }
        },

        resize: function () {
            var canvas = this.canvas, context = this.context;

            if (canvas.width !== canvas.clientWidth ||
                canvas.height !== canvas.clientHeight) {

                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;

                context.viewport(0, 0, canvas.width, canvas.height);
            }
        }
    };

});