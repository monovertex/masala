
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

        attachTexture: function (texture, attachment) {
            this.bind();

            this.context.framebufferTexture2D(this.context.FRAMEBUFFER,
                attachment, this.context.TEXTURE_2D, texture, 0);

            this.unbind();
        },

        attachColorTexture: function (texture) {
            this.attachTexture(texture.texture, this.context.COLOR_ATTACHMENT0);
        },

        attachDepthTexture: function (texture) {
            this.attachTexture(texture.texture, this.context.DEPTH_ATTACHMENT);
        },

        attachDepthBuffer: function (buffer) {
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