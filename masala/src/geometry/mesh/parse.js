

define([
    'geometry/vertex',
    'geometry/constants'
], function (Vertex, constants) {

    function parseObj(source) {
        var OBJ = constants.OBJ,
            lines = source.split(/[\n\r]+/g),
            raw = {
                vertices: [],
                normals: [],
                texcoords: [],
                faces: []
            },
            faceFormat,
            faceItem,
            vertices = [],
            indices = [],
            firstIndex,
            lastIndex,
            i;

        _.each(lines, function (line) {
            var dest;

            line = line.trim();

            if (line.substring(0, OBJ.NORMAL.length) ===
                    OBJ.NORMAL) {
                dest = raw.normals;
            } else if (line.substring(0, OBJ.TEXCOORD.length) ===
                    OBJ.TEXCOORD) {
                dest = raw.texcoords;
            } else if (line.substring(0, OBJ.VERTEX.length) ===
                    OBJ.VERTEX) {
                dest = raw.vertices;
            } else if (line.substring(0, OBJ.VERTEX.length) ===
                    OBJ.FACE) {
                dest = raw.faces;
            }

            if (!_.isUndefined(dest)) {
                dest.push(line.split(/ +/g).slice(1));
            }
        });

        faceItem = raw.faces[0][0];

        if (faceItem.indexOf('//') !== -1) {
            faceFormat = OBJ.FACE_FORMAT.VN;
        } else {
            var slashCount = faceItem.split('/').length - 1;

            if (slashCount === 0) {
                faceFormat = OBJ.FACE_FORMAT.V;
            } else if (slashCount === 1) {
                faceFormat = OBJ.FACE_FORMAT.VT;
            } else {
                faceFormat = OBJ.FACE_FORMAT.VTN;
            }
        }

        _.each(raw.faces, function (face) {

            if (face.length === 3) {
                indices.push(vertices.length);
                indices.push(vertices.length + 1);
                indices.push(vertices.length + 2);
            } else if (face.length > 3) {
                firstIndex = vertices.length;
                lastIndex = firstIndex + 1;

                for (i = 0; i < face.length - 2; i++, lastIndex++) {
                    indices.push(firstIndex);
                    indices.push(lastIndex);
                    indices.push(lastIndex + 1);
                }
            } else return;

            _.each(face, function (faceItem) {
                var faceItemData = faceItem.split('/'),
                    vertexRaw = raw.vertices[parseInt(
                        faceItemData[0], 10) - 1],
                    normalRaw,
                    texcoordRaw;

                if (faceFormat === OBJ.FACE_FORMAT.VTN ||
                        faceFormat === OBJ.FACE_FORMAT.VN) {
                    normalRaw = raw.normals[parseInt(
                        faceItemData[2], 10) - 1];
                }



                if (faceFormat === OBJ.FACE_FORMAT.VT ||
                        faceFormat === OBJ.FACE_FORMAT.VTN) {
                    texcoordRaw = raw.texcoords[parseInt(
                        faceItemData[1], 10) - 1];
                }

                switch (faceFormat) {
                    case OBJ.FACE_FORMAT.V:
                        vertex = new Vertex(
                            vertexRaw[0], vertexRaw[1], vertexRaw[2]
                        );
                        break;
                    case OBJ.FACE_FORMAT.VN:
                        vertex = new Vertex(
                            vertexRaw[0], vertexRaw[1], vertexRaw[2],
                            normalRaw[0], normalRaw[1], normalRaw[2]
                        );
                        break;
                    case OBJ.FACE_FORMAT.VTN:
                        vertex = new Vertex(
                            vertexRaw[0], vertexRaw[1], vertexRaw[2],
                            normalRaw[0], normalRaw[1], normalRaw[2],
                            texcoordRaw[0], texcoordRaw[1]
                        );
                        break;
                    case OBJ.FACE_FORMAT.VT:
                        vertex = new Vertex(
                            vertexRaw[0], vertexRaw[1], vertexRaw[2],
                            undefined, undefined, undefined,
                            texcoordRaw[0], texcoordRaw[1]
                        );
                        break;
                }

                vertices.push(vertex);
            });
        });

        return { vertices: vertices, indices: indices };
    }

    return function (source) {
        if (_.isString(source)) {
            return parseObj(source);
        } else {
            return {
                vertices: _.map(source.vertices, function (vertex) {
                    return new Vertex(vertex);
                }),
                indices: _.flatten(source.indices, true)
            };
        }
    };
});