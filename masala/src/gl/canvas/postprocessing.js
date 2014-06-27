

define([
    'gl/framebuffer',
    'gl/canvas/constants',
    'gl/texture'
], function (Framebuffer, constants, Texture) {

    return {
        initializePostprocessing: function () {
            if (!this.get('postprocessing.initialized')) {
                _.bindAll(this, 'resizePostprocessing');

                var context = this.get('context'),
                    postprocessing = {
                        primary: {
                            fbo: new Framebuffer({ context: context })
                        },
                        secondary: {
                            fbo: new Framebuffer({ context: context })
                        },
                        initialized: true,
                        enabled: true
                    };

                this.set('postprocessing', postprocessing);
                this.listenTo(this, 'resize', this.resizePostprocessing);
                this.resizePostprocessing();
            } else {
                this.set('postprocessing.enabled', true);
            }
        },

        resizePostprocessing: function() {
            var postprocessing = this.get('postprocessing');

            if (postprocessing.initialized && postprocessing.enabled) {
                this.resizePostprocessingComponent(postprocessing.primary);
                this.resizePostprocessingComponent(postprocessing.secondary);
            }
        },

        resizePostprocessingComponent: function (component) {
            var context = this.get('context'),
                canvas = this.get('canvas'),
                width = canvas.width,
                height = canvas.height;

            if (!_.isUndefined(component.colorTexture)) {
                delete component.colorTexture;
            }

            component.colorTexture = new Texture(
                { context: context },
                _.extend({
                    source: null,
                    width: width,
                    height: height
                }, constants.RTT.TEXTURE)
            );

            component.fbo.attachColorTexture(component.colorTexture);
        }
    };

});