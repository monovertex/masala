

define([
    'gl/framebuffer',
    'gl/program',
    'gl/canvas/constants',
    'gl/texture',

    'geometry/mesh'
], function (Framebuffer, Program, constants, Texture, Mesh) {

    return {
        initializeRTT: function () {
            if (_.isUndefined(this.rtt)) {
                var context = this.context,
                    rtt = {
                        fbo: new Framebuffer(context),
                        program: new Program(context,
                            constants.RTT.PROGRAM.shaders)
                    };

                this.rtt = rtt;

                rtt.mesh = new Mesh(context, constants.RTT.MESH);
            }

            this.rttEnabled = true;
            this.resizeRTT();
        },

        resizeRTT: function () {
            if (!_.isUndefined(this.rtt) && this.rttEnabled) {
                var context = this.context,
                    rtt = this.rtt,
                    width = this.canvas.width * this.config.multisampling,
                    height = this.canvas.height * this.config.multisampling;

                if (!_.isUndefined(rtt.colorTexture)) {
                    delete rtt.colorTexture;
                }

                rtt.colorTexture = new Texture(
                    _.extend({
                        source: null,
                        width: width,
                        height: height
                    }, constants.RTT.TEXTURE),
                    context
                );

                rtt.fbo.attachColorTexture(rtt.colorTexture);

                if (this.extensionAvailable('WEBGL_depth_texture')) {
                    if (!_.isUndefined(rtt.depthTexture)) {
                        delete rtt.depthTexture;
                    }

                    rtt.depthTexture = new Texture(
                        _.extend({
                            source: null,
                            width: width,
                            height: height,
                            format: 'DEPTH_COMPONENT',
                            type: 'UNSIGNED_SHORT'
                        }, constants.RTT.TEXTURE),
                        context
                    );

                    rtt.fbo.attachDepthTexture(rtt.depthTexture);
                } else {
                    if (!_.isUndefined(rtt.depthbuffer)) {
                        delete rtt.depthbuffer;
                    }

                    rtt.depthbuffer = context.createRenderbuffer();

                    context.bindRenderbuffer(context.RENDERBUFFER, rtt.depthbuffer);
                    context.renderbufferStorage(
                        context.RENDERBUFFER,
                        context.DEPTH_COMPONENT16,
                        width,
                        height
                    );

                    rtt.fbo.attachDepthBuffer(rtt.depthbuffer);
                }
            }
        }
    };

});