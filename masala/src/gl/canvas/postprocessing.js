

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
                        primary: {
                            fbo: new Framebuffer(context)
                        },
                        secondary: {
                            fbo: new Framebuffer(context)
                        }
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
                    width = this.canvas.width * this.config.multisampling,
                    height = this.canvas.height * this.config.multisampling;

                _.each(postprocessing, function (obj) {
                    if (!_.isUndefined(obj.colorTexture)) {
                        delete obj.colorTexture;
                    }

                    obj.colorTexture = new Texture(
                        _.extend({
                            source: null,
                            width: width,
                            height: height
                        }, constants.RTT.TEXTURE),
                        context
                    );

                    obj.fbo.attachColorTexture(obj.colorTexture);
                }, this);
            }
        }
    };

});