

define([
    'gl/framebuffer',
    'gl/canvas/constants',
    'gl/texture'
], function (Framebuffer, constants, Texture) {

    return {
        initializePostprocessing: function () {
            if (_.isUndefined(this.postprocessing)) {
                var context = this.context,
                    postprocessing = {
                        framebuffer: new Framebuffer(context)
                    };

                this.postprocessing = postprocessing;
            }

            this.postprocessingEnabled = true;
            this.resizePostprocessing();
        },

        resizePostprocessing: function() {
            if (!_.isUndefined(this.postprocessing) &&
                    this.postprocessingEnabled) {
                var context = this.context,
                    postprocessing = this.postprocessing,
                    width = this.canvas.width,
                    height = this.canvas.height;

                if (!_.isUndefined(postprocessing.texture)) {
                    delete postprocessing.texture;
                }

                postprocessing.texture = new Texture(
                    _.extend({
                        source: null,
                        width: width,
                        height: height
                    }, constants.RTT.TEXTURE),
                    context
                );

                postprocessing.framebuffer.attachColor(postprocessing.texture);
            }
        }
    };

});