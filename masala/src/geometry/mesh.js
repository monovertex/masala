

define([
    'geometry/constants',
    'gl/program/constants',
    'utility/class',
    'geometry/mesh/parse'
], function (geometryConstants, programConstants, Class, parse) {

    return Class.extend({

        initialize: function (context, source, programs) {
            this.context = context;
            this.programs = programs;

            var rawData = this.parse(source),
                vbo = context.createBuffer(),
                ibo = context.createBuffer(),
                coordsList, flat, i, maxCoord = 0;

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
            _.forEach(programs, this.linkAttributes, this);

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

            _.bindAll(this, 'linkAttributes');
        },

        render: function () {
            var context = this.context;

            context.bindBuffer(context.ARRAY_BUFFER, this.vbo);

            _.forEach(this.programs, this.linkAttributes, this);

            context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, this.ibo);

            context.drawElements(context.TRIANGLES, this.indexCount,
                context.UNSIGNED_SHORT, 0);
        },

        parse: parse,

        linkAttributes: function (program) {
            var context = this.context,
                VERTEX = geometryConstants.VERTEX,
                attributePosition = program.getAttribLoc(
                    programConstants.ATTRIBUTES.VERTEX_POSITION),
                attributeNormal = program.getAttribLoc(
                    programConstants.ATTRIBUTES.VERTEX_NORMAL),
                attributeTexcoords = program.getAttribLoc(
                    programConstants.ATTRIBUTES.VERTEX_TEX_COORDS);

            if (attributePosition >= 0) {
                context.vertexAttribPointer(
                    attributePosition,
                    VERTEX.ITEM_SIZE.POSITION,
                    context.FLOAT,
                    false, VERTEX.SIZE, VERTEX.ITEM_OFFSET.POSITION
                );
            }

            if (attributeNormal >= 0) {
                context.vertexAttribPointer(
                    attributeNormal,
                    VERTEX.ITEM_SIZE.NORMAL,
                    context.FLOAT,
                    false, VERTEX.SIZE, VERTEX.ITEM_OFFSET.NORMAL
                );
            }

            if (attributeTexcoords >= 0) {
                context.vertexAttribPointer(
                    attributeTexcoords,
                    VERTEX.ITEM_SIZE.TEX_COORD,
                    context.FLOAT,
                    false, VERTEX.SIZE, VERTEX.ITEM_OFFSET.TEX_COORD
                );
            }
        }

    });

});