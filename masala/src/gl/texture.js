

define([
    'utility/class'
], function (Class) {

    return Class.extend({

        initialize: function (options, context) {
            var texture = context.createTexture(),
                wrapS = 'REPEAT',
                wrapT = 'REPEAT',
                filterMag = 'NEAREST',
                filterMin = 'NEAREST';

            if (!_.isUndefined(options.wrap)) {
                if (_.isString(options.wrap)) {
                    wrapS = options.wrap;
                    wrapT = wrapS;
                } else {
                    if (!_.isUndefined(options.wrap.s)) {
                        wrapS = options.wrap.s;
                    }

                    if (!_.isUndefined(options.wrap.t)) {
                        wrapT = options.wrap.t;
                    }
                }
            }

            if (!_.isUndefined(options.filter)) {
                if (_.isString(options.filter)) {
                    filterMag = options.filter;
                    filterMin = filterMag;
                } else {
                    if (!_.isUndefined(options.filter.min)) {
                        filterMin = options.filter.min;
                    }

                    if (!_.isUndefined(options.filter.mag)) {
                        filterMag = options.filter.mag;
                    }
                }
            }

            // Create texture, inverse it.
            context.bindTexture(context.TEXTURE_2D, texture);
            context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, true);

            // Wrap options.
            context.texParameteri(
                context.TEXTURE_2D,
                context.TEXTURE_WRAP_S,
                context[wrapS]
            );
            context.texParameteri(
                context.TEXTURE_2D,
                context.TEXTURE_WRAP_T,
                context[wrapT]
            );

            // Filter options.
            context.texParameteri(
                context.TEXTURE_2D,
                context.TEXTURE_MIN_FILTER,
                context[filterMin]
            );
            context.texParameteri(
                context.TEXTURE_2D,
                context.TEXTURE_MAG_FILTER,
                context[filterMag]
            );

            if (filterMin.indexOf('MIPMAP') !== -1) {
                context.generateMipmap(context.TEXTURE_2D);
            }

            // Buffer data.
            context.texImage2D(
                context.TEXTURE_2D,
                0,
                context[options.format] || context.RGBA,
                context[options.format] || context.RGBA,
                context[options.type] || context.UNSIGNED_BYTE,
                options.source
            );

            // Clear up binding point.
            context.bindTexture(context.TEXTURE_2D, null);

            this.texture = texture;
            this.context = context;
        },

        render: function (unit, alpha) {
            var context = this.context,
                program = context._currentProgram,
                uniformName = (alpha ? 'alphaTexture' : 'colorTexture');

            context.activeTexture(context.TEXTURE0 + unit);
            context.bindTexture(context.TEXTURE_2D, this.texture);
            context.uniform1i(program.getUniformLoc(uniformName), unit);
        }

    });

});