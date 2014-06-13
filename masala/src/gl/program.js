
define([
    'utility/class',
    'gl/program/constants'
], function (Class, programConstants) {

    return Class.extend({

        initialize: function (context, sources) {
            var program = context.createProgram();

            _.each(sources, function(source, type) {
                var shader;

                if (type === programConstants.TYPE.FRAGMENT) {
                    shader = context.createShader(context.FRAGMENT_SHADER);
                } else if (type === programConstants.TYPE.VERTEX) {
                    shader = context.createShader(context.VERTEX_SHADER);
                } else {
                    throw('Unknown shader type');
                }

                context.shaderSource(shader, source);
                context.compileShader(shader);

                if (!context.getShaderParameter(shader,
                        context.COMPILE_STATUS)) {
                    throw('Shader compilation error: \n' +
                        context.getShaderInfoLog(shader));
                }

                context.attachShader(program, shader);
            }, this);

            context.linkProgram(program);

            if (!context.getProgramParameter(program, context.LINK_STATUS)) {
                throw('Could not link program: \n' +
                    context.getProgramInfoLog(program));
            }

            this.context = context;
            this.program = program;
            this.uniforms = {};
            this.attributes = {};

            _.bindAll(this, 'getUniformLoc', 'getAttribLoc', 'use');
        },

        getUniformLoc: function (uniform) {
            var context = this.context;

            if (_.isUndefined(this.uniforms[uniform])) {
                this.uniforms[uniform] = context.getUniformLocation(
                    this.program, uniform);
            }

            return this.uniforms[uniform];
        },

        getAttribLoc: function (attribute) {
            var context = this.context;

            if (_.isUndefined(this.attributes[attribute])) {
                this.attributes[attribute] = context.getAttribLocation(
                    this.program, attribute);

                if (this.attributes[attribute] > 0 ||
                        this.attributes[attribute] === 0) {
                    context.enableVertexAttribArray(this.attributes[attribute]);
                }
            }

            return this.attributes[attribute];
        },

        use: function (attribute) {
            this.context.useProgram(this.program);
            this.context._currentProgram = this;
        }

    });

});