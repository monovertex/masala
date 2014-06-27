
define([
    'scaffolding/class'
], function (Class) {

    return Class.extend({

        initialize: function () {
            this.set('fbo', this.get('context').createFramebuffer());
        },

        bind: function () {
            var context = this.get('context');

            context.bindFramebuffer(context.FRAMEBUFFER, this.get('fbo'));
        },

        unbind: function () {
            var context = this.get('context');

            context.bindFramebuffer(context.FRAMEBUFFER, null);
        },

        attachTexture: function (texture, attachment) {
            var context = this.get('context');

            this.bind();

            context.framebufferTexture2D(context.FRAMEBUFFER,
                attachment, context.TEXTURE_2D, texture, 0);

            this.unbind();
        },

        attachColorTexture: function (texture) {
            this.attachTexture(texture.get('texture'),
                this.get('context').COLOR_ATTACHMENT0);
        },

        attachDepthTexture: function (texture) {
            this.attachTexture(texture.get('texture'),
                this.get('context').DEPTH_ATTACHMENT);
        },

        attachDepthBuffer: function (buffer) {
            var context = this.get('context');

            context.framebufferRenderbuffer(context.FRAMEBUFFER,
                context.DEPTH_ATTACHMENT, context.RENDERBUFFER, buffer);
        }

    });


});