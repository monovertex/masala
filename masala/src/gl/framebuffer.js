
define([
    'utility/class'
], function (Class) {

    return Class.extend({

        initialize: function (context) {
            var framebuffer = context.createFramebuffer();

            this.framebuffer = framebuffer;
            this.context = context;
        },

        bind: function () {
            this.context.bindFramebuffer(this.context.FRAMEBUFFER,
                this.framebuffer);
        },

        unbind: function () {
            this.context.bindFramebuffer(this.context.FRAMEBUFFER, null);
        },

        attachColor: function (texture) {
            this.bind();

            this.context.framebufferTexture2D(
                this.context.FRAMEBUFFER,
                this.context.COLOR_ATTACHMENT0,
                this.context.TEXTURE_2D,
                texture.texture,
                0
            );

            this.unbind();
        },

        attachDepth: function (buffer) {
            this.bind();

            this.context.framebufferRenderbuffer(
                this.context.FRAMEBUFFER,
                this.context.DEPTH_ATTACHMENT,
                this.context.RENDERBUFFER,
                buffer
            );

            this.unbind();
        }

    });


});