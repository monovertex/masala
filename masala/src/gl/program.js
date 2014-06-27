
define([
    'scaffolding/class',
    'gl/program/constants'
], function (Class, programConstants) {

    return Class.extend({

        initialize: function (attributes, options) {
            var context = this.get('context'),
                program = context.createProgram();

            _.bindAll(this, 'getUniformLoc', 'getAttribLoc', 'use');

            _.each(options.sources, function(source, type) {
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

            this.set('program', program)
                .set('uniforms', {})
                .set('attributes', {});
        },

        getUniformLoc: function (uniform) {
            var context = this.get('context'),
                uniforms = this.get('uniforms'),
                program = this.get('program');

            if (_.isUndefined(uniforms[uniform])) {
                uniforms[uniform] = context.getUniformLocation(program,
                    uniform);
            }

            return uniforms[uniform];
        },

        getAttribLoc: function (attribute) {
            var context = this.get('context'),
                attributes = this.get('attributes'),
                program = this.get('program');

            if (_.isUndefined(attributes[attribute])) {
                attributes[attribute] = context.getAttribLocation(program,
                    attribute);

                if (attributes[attribute] > 0 || attributes[attribute] === 0) {
                    context.enableVertexAttribArray(attributes[attribute]);
                }
            }

            return attributes[attribute];
        },

        use: function () {
            var context = this.get('context');

            context.useProgram(this.get('program'));
            context._currentProgram = this;
        }

    });

});