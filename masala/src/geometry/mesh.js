

define([
    'geometry/constants',
    'gl/program/constants',
    'utility/class',
    'geometry/mesh/parse'
], function (geometryConstants, programConstants, Class, parse) {

    return Class.extend(_.extend({

        initialize: function (context, source) {
            this.context = context;

            var rawData = this.parse(source),
                vbo = context.createBuffer(),
                ibo = context.createBuffer(),
                coordsList, flat, i, maxCoord = 0;

            _.bindAll(this, 'linkAttributes');

            coordsList = _.flatten(_.reduce(
                rawData.vertices,
                function (result, vertex) {
                    flat = vertex.flatten();

                    for (i = 0; i < 3; i++) {
                        if (Math.abs(flat[i]) > maxCoord) {
                            maxCoord = Math.abs(flat[i]);
                        }
                    }

                    result.push(flat);
                    return result;
                },
                []
            ), true);

            context.bindBuffer(context.ARRAY_BUFFER, vbo);

            context.bufferData(
                context.ARRAY_BUFFER,
                new Float32Array(_.map(coordsList, function (coord) {
                    return coord / maxCoord;
                })),
                context.STATIC_DRAW
            );

            context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, ibo);

            context.bufferData(
                context.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(rawData.indices),
                context.STATIC_DRAW
            );

            this.vbo = vbo;
            this.ibo = ibo;
            this.indexCount = rawData.indices.length;
        },

        render: function () {
            var context = this.context;

            context.bindBuffer(context.ARRAY_BUFFER, this.vbo);

            this.linkAttributes();

            context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, this.ibo);

            context.drawElements(context.TRIANGLES, this.indexCount,
                context.UNSIGNED_SHORT, 0);
        },

        linkAttributes: function () {
            var context = this.context,
                VERTEX = geometryConstants.VERTEX;

            context.vertexAttribPointer(
                programConstants.ATTRIBUTES.VERTEX_POSITION,
                VERTEX.ITEM_SIZE.POSITION,
                context.FLOAT,
                false, VERTEX.SIZE, VERTEX.ITEM_OFFSET.POSITION
            );

            context.vertexAttribPointer(
                programConstants.ATTRIBUTES.VERTEX_NORMAL,
                VERTEX.ITEM_SIZE.NORMAL,
                context.FLOAT,
                false, VERTEX.SIZE, VERTEX.ITEM_OFFSET.NORMAL
            );

            context.vertexAttribPointer(
                programConstants.ATTRIBUTES.VERTEX_TEX_COORDS,
                VERTEX.ITEM_SIZE.TEX_COORD,
                context.FLOAT,
                false, VERTEX.SIZE, VERTEX.ITEM_OFFSET.TEX_COORD
            );
        }

    }, parse));

});