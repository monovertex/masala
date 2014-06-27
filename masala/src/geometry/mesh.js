

define([
    'geometry/constants',
    'gl/program/constants',
    'scaffolding/class',
    'geometry/mesh/parse'
], function (geometryConstants, programConstants, Class, parse) {

    return Class.extend(_.extend({

        initialize: function (attributes, options) {
            _.bindAll(this, 'linkAttributes');

            var context = this.get('context'),
                rawData = this.parse(options.source),
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

            this.set('vbo', vbo);
            this.set('ibo', ibo);
            this.set('indexCount', rawData.indices.length);
        },

        render: function () {
            var context = this.get('context');

            context.bindBuffer(context.ARRAY_BUFFER, this.get('vbo'));

            this.linkAttributes();

            context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, this.get('ibo'));

            context.drawElements(context.TRIANGLES, this.get('indexCount'),
                context.UNSIGNED_SHORT, 0);
        },

        linkAttributes: function () {
            var context = this.get('context'),
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