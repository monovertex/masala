

define([
    'gl/framebuffer',
    'gl/program',
    'gl/canvas/constants',
    'gl/texture',

    'geometry/mesh'
], function (Framebuffer, Program, constants, Texture, Mesh) {

    return {
        initializeRTT: function () {
            if (!this.get('rtt.initialized')) {
                _.bindAll(this, 'resizeRTT');

                var context = this.get('context'),
                    rtt = {
                        fbo: new Framebuffer({ context: context }),
                        program: new Program(
                            { context: context },
                            { sources: constants.RTT.PROGRAM.shaders }
                        ),
                        mesh: new Mesh(
                            { context: context },
                            { source: constants.RTT.MESH }
                        ),
                        initialized: true,
                        enabled: true
                    };

                this.set('rtt', rtt);
                this.listenTo(this, 'resize', this.resizeRTT);
                this.resizeRTT();
            } else {
                this.set('rtt.enabled', true);
            }
        },

        resizeRTT: function () {
            var rtt = this.get('rtt');

            if (rtt.initialized && rtt.enabled) {
                var context = this.get('context'),
                    canvas = this.get('canvas'),
                    width = canvas.width,
                    height = canvas.height;

                if (!_.isUndefined(rtt.colorTexture)) {
                    delete rtt.colorTexture;
                }

                rtt.colorTexture = new Texture(
                    { context: context },
                    _.extend({
                        source: null,
                        width: width,
                        height: height
                    }, constants.RTT.TEXTURE)
                );

                rtt.fbo.attachColorTexture(rtt.colorTexture);

                if (this.extensionAvailable('WEBGL_depth_texture')) {
                    if (!_.isUndefined(rtt.depthTexture)) {
                        delete rtt.depthTexture;
                    }

                    rtt.depthTexture = new Texture(
                        { context: context },
                        _.extend({
                            source: null,
                            width: width,
                            height: height,
                            format: 'DEPTH_COMPONENT',
                            type: 'UNSIGNED_SHORT'
                        }, constants.RTT.TEXTURE)
                    );

                    rtt.fbo.attachDepthTexture(rtt.depthTexture);
                } else {
                    if (!_.isUndefined(rtt.depthbuffer)) {
                        delete rtt.depthbuffer;
                    }

                    rtt.depthbuffer = context.createRenderbuffer();

                    context.bindRenderbuffer(context.RENDERBUFFER,
                        rtt.depthbuffer);
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